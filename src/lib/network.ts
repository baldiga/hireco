import "server-only";
import { adminClient } from "./supabase/admin";

export type YearMonth = { year: number; month?: number };
export type Position = {
  title?: string;
  company?: string;
  companyUrn?: string;
  start?: YearMonth;
  end?: YearMonth | null;
  location?: string;
};

export type Connection = {
  public_id: string;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  current_title: string | null;
  current_company: string | null;
  positions: Position[] | null;
  location: string | null;
  connected_at: string | null;
  enriched_at: string | null;
};

export type Seniority = "c_level" | "vp" | "head" | "director" | "manager" | "ic";

const SENIORITY_RULES: [Seniority, RegExp][] = [
  ["c_level", /\b(ceo|cto|cfo|coo|cmo|cpo|cro|chro|ciso|chief|founder|co-founder|cofounder|owner|president|managing partner|general partner)\b/i],
  ["vp", /\b(vp|svp|evp|vice president)\b/i],
  ["head", /\bhead of\b|\bhead\b/i],
  ["director", /\bdirector\b/i],
  ["manager", /\b(manager|team lead|lead|supervisor)\b/i],
];
const RECRUITER = /recruit|talent|sourc(er|ing)|headhunt|\bhr\b|human resources|people (partner|ops|operations)|hrbp|staffing/i;

export function seniorityOf(title: string | null | undefined): Seniority {
  if (!title) return "ic";
  for (const [level, re] of SENIORITY_RULES) if (re.test(title)) return level;
  return "ic";
}

const SUFFIXES = /\b(ltd|limited|inc|incorporated|llc|gmbh|plc|corp|corporation|co|company|group|technologies|technology|labs|bv|sa|ag)\b\.?/gi;
export function normCompany(name: string | null | undefined) {
  return (name ?? "")
    .toLowerCase()
    .replace(/\.(com|io|ai|co|net|org)\b/g, "")
    .replace(SUFFIXES, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
function sameCompany(a: string | null | undefined, b: string | null | undefined) {
  const x = normCompany(a), y = normCompany(b);
  if (x.length < 2 || y.length < 2) return false;
  if (x === y) return true;
  const [short, long] = x.length < y.length ? [x, y] : [y, x];
  return short.length >= 4 && new RegExp(`\\b${short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(long);
}

/** "Head of Growth at Acme | ex-Foo" -> { title, company } */
export function parseHeadline(headline: string | null | undefined) {
  const first = (headline ?? "").split(/\s[|•·]\s/)[0];
  const m = first.match(/^(.*?)\s+(?:at|@)\s+(.+)$/i);
  return m ? { title: m[1].trim(), company: m[2].trim() } : { title: first.trim() || null, company: null };
}

const monthIndex = (d?: YearMonth | null, fallback = Infinity) =>
  d?.year ? d.year * 12 + ((d.month ?? 1) - 1) : fallback;

function overlapMonths(a: Position, b: Position) {
  const s = Math.max(monthIndex(a.start, -Infinity), monthIndex(b.start, -Infinity));
  const e = Math.min(monthIndex(a.end), monthIndex(b.end));
  if (!Number.isFinite(s) || !Number.isFinite(e)) return null; // unknown dates
  return e - s + 1;
}

export const profileUrl = (publicId: string) => `https://www.linkedin.com/in/${publicId}/`;

function brief(c: Connection) {
  return {
    name: [c.first_name, c.last_name].filter(Boolean).join(" "),
    url: profileUrl(c.public_id),
    title: c.current_title,
    company: c.current_company,
    headline: c.headline,
    enriched: !!c.enriched_at,
  };
}

export async function loadConnections(userId: string): Promise<Connection[]> {
  const db = adminClient();
  const all: Connection[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await db
      .from("connections")
      .select("public_id, first_name, last_name, headline, current_title, current_company, positions, location, connected_at, enriched_at")
      .eq("user_id", userId)
      .order("id")
      .range(from, from + page - 1);
    if (error) throw error;
    all.push(...(data as Connection[]));
    if (!data || data.length < page) break;
  }
  // Until a connection is enriched, its title/company come from the headline.
  for (const c of all) {
    if (c.enriched_at) continue;
    const parsed = parseHeadline(c.headline);
    c.current_title ??= parsed.title;
    c.current_company ??= parsed.company;
  }
  return all;
}

export async function loadProfile(userId: string) {
  const { data } = await adminClient()
    .from("profiles")
    .select("full_name, headline, linkedin_public_id, positions, educations")
    .eq("id", userId)
    .maybeSingle();
  return data as { full_name: string | null; headline: string | null; linkedin_public_id: string | null; positions: Position[]; educations: unknown[] } | null;
}

const matchesAny = (text: string, keywords: string[]) => {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
};

export function searchNetwork(
  conns: Connection[],
  q: { query?: string; company?: string; title?: string; seniority?: Seniority[]; include_past?: boolean; limit?: number },
) {
  const res = conns.filter((c) => {
    const title = c.current_title ?? c.headline ?? "";
    if (q.title && !matchesAny(title, q.title.split(/\s*,\s*/))) return false;
    if (q.seniority?.length && !q.seniority.includes(seniorityOf(title))) return false;
    if (q.company) {
      const now = sameCompany(c.current_company, q.company);
      const past = q.include_past && (c.positions ?? []).some((p) => sameCompany(p.company, q.company));
      if (!now && !past) return false;
    }
    if (q.query) {
      const hay = [c.first_name, c.last_name, c.headline, c.current_title, c.current_company, c.location,
        ...(c.positions ?? []).flatMap((p) => [p.title, p.company])].join(" ");
      if (!matchesAny(hay, q.query.split(/\s*,\s*/))) return false;
    }
    return true;
  });
  return { total: res.length, results: res.slice(0, q.limit ?? 50).map(brief) };
}

const SENIOR: Seniority[] = ["c_level", "vp", "head", "director"];
const MANAGERS: Seniority[] = ["manager", "head", "director"];


/** Result of a LinkedIn "1st-degree + current/past company" search, run by the extension. */
export type CompanyHit = { company: string; relation: "current" | "past"; public_ids: string[] };

type Person = ReturnType<typeof brief> & { why: string; at_target?: boolean; overlap_months?: number | null };

export function findHiringPaths(
  conns: Connection[],
  me: { positions: Position[] } | null,
  q: { role_keywords: string[]; target_companies?: string[]; limit_per_bucket?: number },
  companyHits: CompanyHit[] = [],
) {
  const limit = q.limit_per_bucket ?? 25;
  const targets = q.target_companies ?? [];
  const atTarget = (company: string | null | undefined) => targets.find((t) => sameCompany(company, t));
  const myCompanies = (me?.positions ?? []).map((p) => p.company).filter(Boolean) as string[];
  const buckets = {
    hiring_managers: new Map<string, Person>(),
    decision_makers: new Map<string, Person>(),
    insiders: new Map<string, Person>(),
    recruiters: new Map<string, Person>(),
    introducers: new Map<string, Person>(),
    ex_coworkers: new Map<string, Person>(),
  };
  const add = (bucket: Map<string, Person>, id: string, p: Person) => { if (!bucket.has(id)) bucket.set(id, p); };

  // LinkedIn search tells us who is (or was) at a company even when the headline doesn't say so.
  const nowAtTarget = new Map<string, string>();
  const pastAtTarget = new Map<string, Set<string>>();
  const sharedWithMe = new Map<string, Set<string>>();
  for (const hit of companyHits) {
    const target = atTarget(hit.company);
    const mine = myCompanies.find((m) => sameCompany(m, hit.company));
    for (const id of hit.public_ids) {
      if (target && hit.relation === "current") nowAtTarget.set(id, target);
      if (target && hit.relation === "past") pastAtTarget.set(id, (pastAtTarget.get(id) ?? new Set()).add(target));
      if (mine) sharedWithMe.set(id, (sharedWithMe.get(id) ?? new Set()).add(mine));
    }
  }

  for (const c of conns) {
    const id = c.public_id;
    const title = c.current_title ?? c.headline ?? "";
    const level = seniorityOf(title);
    const inFunction = matchesAny(`${title} ${c.headline ?? ""}`, q.role_keywords);
    const target = atTarget(c.current_company) ?? nowAtTarget.get(id);
    const b = brief(c);

    if (inFunction && MANAGERS.includes(level))
      add(buckets.hiring_managers, id, { ...b, why: `${level} in your function${target ? ` at target ${target}` : ""}`, at_target: !!target });
    if (SENIOR.includes(level) && (inFunction || (target && level === "c_level")))
      add(buckets.decision_makers, id, { ...b, why: `${level}${inFunction ? " in your function" : ""}${target ? ` at target ${target}` : ""}`, at_target: !!target });
    if (target) add(buckets.insiders, id, { ...b, why: `works at ${target}` });
    if (RECRUITER.test(title))
      add(buckets.recruiters, id, { ...b, why: `recruiting / talent${target ? ` at target ${target}` : ""}`, at_target: !!target });

    const pastTargets = new Set([
      ...(c.positions ?? []).filter((p) => p.end && atTarget(p.company)).map((p) => atTarget(p.company)!),
      ...(pastAtTarget.get(id) ?? []),
    ]);
    if (pastTargets.size && !target)
      add(buckets.introducers, id, { ...b, why: `previously at ${[...pastTargets].join(", ")} — knows people there` });

    // Ex-coworkers: exact overlap from enriched history first, then LinkedIn search matches.
    for (const mine of me?.positions ?? []) {
      const theirs = (c.positions ?? []).find((p) => sameCompany(p.company, mine.company));
      if (!theirs) continue;
      const months = overlapMonths(mine, theirs);
      if (months === null || months > 0) {
        add(buckets.ex_coworkers, id, { ...b, why: `both at ${mine.company}${months ? ` (~${months} months overlap)` : ""}`, overlap_months: months });
        break;
      }
    }
    const shared = sharedWithMe.get(id);
    if (shared && !c.enriched_at)
      add(buckets.ex_coworkers, id, { ...b, why: `also worked at ${[...shared].join(", ")} (dates not checked yet)`, overlap_months: null });
  }

  const byTargetFirst = (a: Person, b: Person) => Number(b.at_target ?? 0) - Number(a.at_target ?? 0);
  return {
    coverage: {
      connections: conns.length,
      enriched_with_work_history: conns.filter((c) => c.enriched_at).length,
      company_searches: companyHits.length,
    },
    buckets: Object.fromEntries(
      Object.entries(buckets).map(([k, v]) => [k, { total: v.size, people: [...v.values()].sort(byTargetFirst).slice(0, limit) }]),
    ),
  };
}
