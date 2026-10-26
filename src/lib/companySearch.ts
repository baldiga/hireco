import "server-only";
import { normCompany } from "./network";
import { adminClient } from "./supabase/admin";

export type Relation = "current" | "past";
export type CompanySpec = { company: string; companyId?: string; relation: Relation };
export type CompanyResult = { company: string; relation: Relation; status: string; public_ids: string[] };

const STALE_MS = 14 * 24 * 3600_000;
const RUNNING_TIMEOUT_MS = 5 * 60_000;

/** "urn:li:fsd_company:123" -> "123" */
export const companyIdFromUrn = (urn?: string | null) => urn?.match(/(\d+)$/)?.[1];
const keyOf = (s: CompanySpec) => s.companyId ?? `name:${normCompany(s.company)}`;

/** Queues searches that are missing, stale, failed or stuck. Returns all requested rows' keys. */
export async function ensureSearches(userId: string, specs: CompanySpec[]) {
  const db = adminClient();
  const unique = [...new Map(specs.map((s) => [`${keyOf(s)}|${s.relation}`, s])).values()];
  if (!unique.length) return [];

  const { data: existing } = await db
    .from("company_searches")
    .select("company_key, relation, status, finished_at, started_at")
    .eq("user_id", userId)
    .in("company_key", unique.map(keyOf));
  const byKey = new Map((existing ?? []).map((r) => [`${r.company_key}|${r.relation}`, r]));

  const now = Date.now();
  const toQueue = unique.filter((s) => {
    const r = byKey.get(`${keyOf(s)}|${s.relation}`);
    if (!r || r.status === "error") return true;
    if (r.status === "done") return now - Date.parse(r.finished_at) > STALE_MS;
    if (r.status === "running") return now - Date.parse(r.started_at) > RUNNING_TIMEOUT_MS;
    return false; // pending
  });
  if (toQueue.length) {
    const { error } = await db.from("company_searches").upsert(
      // Stagger requested_at so the extension runs them in the order given.
      toQueue.map((s, i) => ({
        user_id: userId,
        company_key: keyOf(s),
        company_id: s.companyId ?? null,
        company_name: s.company,
        relation: s.relation,
        status: "pending",
        error: null,
        requested_at: new Date(Date.now() + i).toISOString(),
        started_at: null,
      })),
      { onConflict: "user_id,company_key,relation" },
    );
    if (error) throw error;
  }
  return unique.map((s) => ({ key: keyOf(s), relation: s.relation, company: s.company }));
}

/** Waits (up to timeoutMs) for the extension to finish the given searches, then returns them. */
export async function awaitSearches(userId: string, keys: { key: string; relation: Relation; company: string }[], timeoutMs = 45_000) {
  const db = adminClient();
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { data, error } = await db
      .from("company_searches")
      .select("company_key, company_name, relation, status, public_ids")
      .eq("user_id", userId)
      .in("company_key", keys.map((k) => k.key));
    if (error) throw error;
    const rows = keys
      .map((k) => data.find((r) => r.company_key === k.key && r.relation === k.relation))
      .filter(Boolean) as { company_key: string; company_name: string; relation: Relation; status: string; public_ids: string[] }[];
    const pending = rows.filter((r) => r.status === "pending" || r.status === "running").length;
    if (!pending || Date.now() > deadline) {
      return {
        pending,
        results: rows.map((r): CompanyResult => ({ company: r.company_name, relation: r.relation, status: r.status, public_ids: r.public_ids })),
      };
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

export async function runSearches(userId: string, specs: CompanySpec[], timeoutMs?: number) {
  return awaitSearches(userId, await ensureSearches(userId, specs), timeoutMs);
}
