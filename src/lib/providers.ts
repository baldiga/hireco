import "server-only";
import type { Position, YearMonth } from "./network";

// Server-side enrichment, only on the operator's own APIFY_TOKEN (the early-access allowance).
// Members' own Apify/Zooq keys never reach Hireco: their AI calls its own provider MCP and
// sends the results back with import_profiles.
export type Enriched = {
  public_id: string;
  full_name: string;
  headline: string | null;
  location: string | null;
  positions: Position[];
  educations: { school?: string; degree?: string; field?: string; start?: YearMonth; end?: YearMonth }[];
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
type RawDate = { year?: number; month?: number | string; text?: string } | null | undefined;

function ym(d: RawDate): YearMonth | undefined {
  if (!d?.year) return undefined;
  const raw = d.month ?? d.text?.split(" ")[0];
  const month = typeof raw === "number" ? raw : raw ? MONTHS.indexOf(String(raw).slice(0, 3).toLowerCase()) + 1 : 0;
  return month > 0 ? { year: d.year, month } : { year: d.year };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const APIFY_ACTOR = "harvestapi~linkedin-profile-scraper";

function fromApify(p: any): Enriched {
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

export async function fetchFromApify(token: string, publicIds: string[]): Promise<Enriched[]> {
  const res = await fetch(`https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?timeout=240`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ publicIdentifiers: publicIds, profileScraperMode: "Profile details no email ($4 per 1k)" }),
  });
  if (!res.ok) throw new Error(`Enrichment provider error ${res.status}`);
  const items = (await res.json()) as unknown[];
  return items.filter((i) => (i as { publicIdentifier?: string })?.publicIdentifier).map(fromApify);
}

/* eslint-enable @typescript-eslint/no-explicit-any */
