import "server-only";
import { currentPosition } from "./ext";
import { COPY } from "./limits";
import { fetchFromApify, type Enriched } from "./providers";
import { adminClient } from "./supabase/admin";

const CACHE_DAYS = 90;
export const MAX_PER_CALL = 50;

/**
 * How this member's premium enrichment runs:
 * "house" the early-access allowance on the operator's Apify key (enrich_prospects)
 * "agent" their own AI fetches profiles with its own provider MCP (their key stays there) and calls import_profiles
 */
export async function getQuota(userId: string) {
  const db = adminClient();
  const [{ data: profile }, { count }] = await Promise.all([
    db.from("profiles").select("enrich_quota").eq("id", userId).maybeSingle(),
    db.from("enrichments").select("public_id", { count: "exact", head: true }).eq("user_id", userId).eq("paid_by", "house"),
  ]);
  const total = profile?.enrich_quota ?? 0;
  const used = count ?? 0;
  const remaining = Math.max(total - used, 0);
  return { mode: remaining > 0 ? ("house" as const) : ("agent" as const), total, used, remaining };
}

/** Writes enriched data onto the member's connections and records who paid for it. */
async function apply(userId: string, results: Map<string, Enriched>, paidBy: "house" | "import") {
  const db = adminClient();
  const now = new Date().toISOString();
  for (const [publicId, p] of results) {
    const current = currentPosition(p.positions);
    await db
      .from("connections")
      .update({
        positions: p.positions,
        educations: p.educations,
        location: p.location,
        ...(p.headline ? { headline: p.headline } : {}),
        current_title: current?.title ?? null,
        current_company: current?.company ?? null,
        enriched_at: now,
        updated_at: now,
      })
      .eq("user_id", userId)
      .eq("public_id", publicId);
  }
  if (results.size)
    await db.from("enrichments").upsert([...results.keys()].map((public_id) => ({ user_id: userId, public_id, paid_by: paidBy })), { ignoreDuplicates: true });
}

/** Adds full work history to some of the member's connections, within their early-access allowance. */
export async function enrichProspects(userId: string, requested: string[]) {
  const db = adminClient();
  const ids = [...new Set(requested)].slice(0, MAX_PER_CALL);

  const quota = await getQuota(userId);
  if (quota.mode === "agent") {
    return {
      enriched: 0,
      use_import_profiles: true,
      tell_the_user: COPY.enrichInAgent,
      how: "If a LinkedIn data tool is connected in this session (e.g. the Zooq MCP's profile_full, or the Apify MCP with harvestapi/linkedin-profile-scraper), fetch these profiles with it after the user agrees, then call import_profiles.",
      quota,
    };
  }

  const { data: rows } = await db.from("connections").select("public_id").eq("user_id", userId).in("public_id", ids);
  const mine = new Set((rows ?? []).map((r) => r.public_id));
  const { data: done } = await db.from("enrichments").select("public_id").eq("user_id", userId).in("public_id", ids);
  const already = new Set((done ?? []).map((r) => r.public_id));

  const candidates = ids.filter((id) => mine.has(id) && !already.has(id));
  const toEnrich = candidates.slice(0, quota.remaining);

  // Shared cache first (free for everyone), the paid provider only for the rest.
  const fresh = new Date(Date.now() - CACHE_DAYS * 86400_000).toISOString();
  const { data: cached } = toEnrich.length
    ? await db.from("linkedin_profiles").select("public_id, data").in("public_id", toEnrich).gte("fetched_at", fresh)
    : { data: [] };
  const results = new Map<string, Enriched>((cached ?? []).map((c) => [c.public_id, c.data as Enriched]));
  const missing = toEnrich.filter((id) => !results.has(id));

  if (missing.length) {
    const fetched = await fetchFromApify(process.env.APIFY_TOKEN!, missing);
    for (const p of fetched) {
      const id = missing.find((m) => m.toLowerCase() === decodeURIComponent(p.public_id).toLowerCase()) ?? p.public_id;
      results.set(id, { ...p, public_id: id });
    }
    if (fetched.length) {
      await db.from("linkedin_profiles").upsert(
        [...results.entries()].filter(([id]) => missing.includes(id)).map(([public_id, data]) => ({ public_id, data, fetched_at: new Date().toISOString() })),
      );
    }
  }

  await apply(userId, results, "house");

  return {
    enriched: results.size,
    from_shared_cache: results.size - missing.filter((id) => results.has(id)).length,
    already_enriched: candidates.length === ids.length ? [] : ids.filter((id) => already.has(id)),
    not_your_connections: ids.filter((id) => !mine.has(id)),
    skipped_over_quota: candidates.slice(quota.remaining),
    not_found: missing.filter((id) => !results.has(id)),
    capped_at_per_call: requested.length > MAX_PER_CALL ? MAX_PER_CALL : undefined,
    quota: await getQuota(userId),
  };
}

/**
 * Work history the member's own AI fetched with another tool (e.g. the Zooq MCP).
 * Only updates this member's connections and never enters the shared cache, since it's unverified.
 */
export async function importProfiles(userId: string, profiles: Enriched[]) {
  const ids = profiles.map((p) => p.public_id);
  const { data: rows } = await adminClient().from("connections").select("public_id").eq("user_id", userId).in("public_id", ids);
  const mine = new Set((rows ?? []).map((r) => r.public_id));
  const results = new Map(profiles.filter((p) => mine.has(p.public_id)).map((p) => [p.public_id, p]));
  await apply(userId, results, "import");
  return { imported: results.size, not_your_connections: ids.filter((id) => !mine.has(id)) };
}
