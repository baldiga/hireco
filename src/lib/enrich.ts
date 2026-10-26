import "server-only";
import { currentPosition } from "./ext";
import type { Position, YearMonth } from "./network";
import { adminClient } from "./supabase/admin";

const ACTOR = "harvestapi~linkedin-profile-scraper";
const CACHE_DAYS = 90;
export const MAX_PER_CALL = 50;

type Enriched = {
  public_id: string;
  full_name: string;
  headline: string | null;
  location: string | null;
  positions: Position[];
  educations: { school?: string; degree?: string; field?: string; start?: YearMonth; end?: YearMonth }[];
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
type ApifyDate = { year?: number; month?: number | string; text?: string } | null | undefined;

function ym(d: ApifyDate): YearMonth | undefined {
  if (!d?.year) return undefined;
  const raw = d.month ?? d.text?.split(" ")[0];
  const month = typeof raw === "number" ? raw : raw ? MONTHS.indexOf(String(raw).slice(0, 3).toLowerCase()) + 1 : 0;
  return month > 0 ? { year: d.year, month } : { year: d.year };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalize(p: any): Enriched {
  return {
    public_id: p.publicIdentifier,
    full_name: [p.firstName, p.lastName].filter(Boolean).join(" "),
    headline: p.headline ?? null,
    location: p.location?.linkedinText ?? null,
    positions: (p.experience ?? []).map((e: any) => ({
      title: e.position ?? undefined,
      company: e.companyName ?? undefined,
      companyUrn: e.companyId ? `urn:li:fsd_company:${e.companyId}` : undefined,
      start: ym(e.startDate),
      end: e.endDate?.year ? ym(e.endDate) : null,
      location: e.location ?? undefined,
    })),
    educations: (p.education ?? []).map((e: any) => ({
      school: e.schoolName ?? undefined,
      degree: e.degree ?? undefined,
      field: e.fieldOfStudy ?? undefined,
      start: ym(e.startDate),
      end: ym(e.endDate),
    })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchFromApify(publicIds: string[]): Promise<Enriched[]> {
  const res = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=240`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.APIFY_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ publicIdentifiers: publicIds, profileScraperMode: "Profile details no email ($4 per 1k)" }),
  });
  if (!res.ok) throw new Error(`Enrichment provider error ${res.status}`);
  const items = (await res.json()) as unknown[];
  return items.filter((i) => (i as { publicIdentifier?: string })?.publicIdentifier).map(normalize);
}

export async function getQuota(userId: string) {
  const db = adminClient();
  const [{ data: profile }, { count }] = await Promise.all([
    db.from("profiles").select("enrich_quota").eq("id", userId).maybeSingle(),
    db.from("enrichments").select("public_id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  const total = profile?.enrich_quota ?? 0;
  const used = count ?? 0;
  return { total, used, remaining: Math.max(total - used, 0) };
}

/** Adds full work history to some of the user's connections, within their prospect quota. */
export async function enrichProspects(userId: string, requested: string[]) {
  const db = adminClient();
  const ids = [...new Set(requested)].slice(0, MAX_PER_CALL);

  const { data: rows } = await db.from("connections").select("public_id").eq("user_id", userId).in("public_id", ids);
  const mine = new Set((rows ?? []).map((r) => r.public_id));
  const { data: done } = await db.from("enrichments").select("public_id").eq("user_id", userId).in("public_id", ids);
  const already = new Set((done ?? []).map((r) => r.public_id));

  const quota = await getQuota(userId);
  const candidates = ids.filter((id) => mine.has(id) && !already.has(id));
  const toEnrich = candidates.slice(0, quota.remaining);

  // Shared cache first, the paid provider only for the rest.
  const fresh = new Date(Date.now() - CACHE_DAYS * 86400_000).toISOString();
  const { data: cached } = toEnrich.length
    ? await db.from("linkedin_profiles").select("public_id, data").in("public_id", toEnrich).gte("fetched_at", fresh)
    : { data: [] };
  const results = new Map<string, Enriched>((cached ?? []).map((c) => [c.public_id, c.data as Enriched]));
  const missing = toEnrich.filter((id) => !results.has(id));
  if (missing.length) {
    const fetched = await fetchFromApify(missing);
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
  if (results.size) await db.from("enrichments").upsert([...results.keys()].map((public_id) => ({ user_id: userId, public_id })));

  return {
    enriched: results.size,
    from_shared_cache: results.size - missing.filter((id) => results.has(id)).length,
    already_enriched: candidates.length === ids.length ? [] : ids.filter((id) => already.has(id)),
    not_your_connections: ids.filter((id) => !mine.has(id)),
    skipped_over_quota: candidates.slice(quota.remaining),
    not_found: toEnrich.filter((id) => !results.has(id)),
    capped_at_per_call: requested.length > MAX_PER_CALL ? MAX_PER_CALL : undefined,
    quota: await getQuota(userId),
  };
}
