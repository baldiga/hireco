// The radar map: people grouped into hubs. The first hubs (numbered) are where to start, in order;
// the rest (lettered) group everyone else. Built automatically or curated by the user's AI.

export const BUCKET_TYPES = ["ex_coworker", "introducer", "insider", "hiring_manager", "decision_maker", "recruiter", "other"] as const;
export type BucketType = (typeof BUCKET_TYPES)[number];

export const BUCKET_INFO: Record<BucketType, { name: string; hint: string }> = {
  ex_coworker: { name: "Ex-coworker", hint: "Has worked with you — the warmest referral" },
  introducer: { name: "Introducer", hint: "Used to work there and still knows people" },
  insider: { name: "Insider or peer", hint: "Works there now and can refer you" },
  hiring_manager: { name: "Hiring manager", hint: "Leads the team and likely owns the hire" },
  decision_maker: { name: "Decision maker", hint: "VP or C-level in your function" },
  recruiter: { name: "Recruiter", hint: "Recruits for the companies or roles you want" },
  other: { name: "Other route", hint: "Agencies, partners and other ways in" },
};

export type MapPerson = { id: string; name: string; title?: string | null; company?: string | null; bucket: BucketType; url?: string; why?: string };
export type MapHub = { id: string; label: string; full?: string; start: boolean; people: string[]; steps?: string[][]; note?: string };
export type MapSpec = { title: string; subtitle?: string; demo?: boolean; me: string; people: MapPerson[]; hubs: MapHub[]; footnote?: string; stats?: { label: string; value: string }[] };

/** Marks: start hubs get 1..n, the rest A..Z. */
export function hubMarks(hubs: MapHub[]) {
  let n = 0, a = 0;
  return hubs.map((h) => (h.start ? String(++n) : String.fromCharCode(65 + a++)));
}

export const initialsOf = (name: string) => {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase() || "ME";
};

// ---- automatic layout from bucketed results ----

type Row = { bucket: string; name: string; title: string | null; company: string | null; url: string; why: string };

const FROM_RESULT: Record<string, BucketType> = {
  ex_coworkers: "ex_coworker", introducers: "introducer", insiders: "insider",
  hiring_managers: "hiring_manager", decision_makers: "decision_maker", recruiters: "recruiter",
};
const WARMTH: Record<BucketType, number> = { ex_coworker: 5, introducer: 4, insider: 3, hiring_manager: 3, decision_maker: 2.5, recruiter: 1.5, other: 1 };
const GROUP_LABEL: Record<BucketType, string> = {
  ex_coworker: "Ex-coworkers", introducer: "Introducers", insider: "Insiders", hiring_manager: "Hiring managers",
  decision_maker: "Decision makers", recruiter: "Recruiters", other: "Other routes",
};
const LABEL_ORDER: BucketType[] = ["ex_coworker", "introducer", "hiring_manager", "decision_maker", "recruiter", "insider", "other"];
const WARM: BucketType[] =["ex_coworker", "introducer", "insider", "recruiter", "other"];
const norm = (s: string) => s.toLowerCase().replace(/\.(com|io|ai|co)\b/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export function autoSpec(rows: Row[], opts: { title: string; me: string; targets?: string[]; maxPeople?: number }): MapSpec {
  const max = opts.maxPeople ?? 64;
  const targets = (opts.targets ?? []).map(norm);

  // One entry per person. Label by relationship, then role ("VP at target" reads better than "insider"); rank by warmth.
  const byUrl = new Map<string, MapPerson & { score: number }>();
  for (const r of rows) {
    const bucket = FROM_RESULT[r.bucket] ?? "other";
    const atTarget = r.company && targets.some((t) => norm(r.company!).includes(t) || t.includes(norm(r.company!)));
    const score = WARMTH[bucket] + (atTarget ? 2 : 0);
    const prev = byUrl.get(r.url);
    if (!prev) {
      byUrl.set(r.url, { id: `p${byUrl.size}`, name: r.name, title: r.title, company: r.company, bucket, url: r.url, why: r.why, score });
    } else {
      if (LABEL_ORDER.indexOf(bucket) < LABEL_ORDER.indexOf(prev.bucket)) prev.bucket = bucket;
      prev.score = Math.max(prev.score, score);
    }
  }
  const people = [...byUrl.values()].sort((a, b) => b.score - a.score).slice(0, max);

  // Company hubs: target companies, or any company with 2+ people on the map.
  const byCompany = new Map<string, typeof people>();
  for (const p of people) if (p.company) byCompany.set(norm(p.company), [...(byCompany.get(norm(p.company)) ?? []), p]);
  const companyHubs = [...byCompany.entries()]
    .filter(([key, ps]) => ps.length >= 2 || targets.some((t) => key.includes(t) || t.includes(key)))
    .map(([, ps]) => {
      const warm = ps.filter((p) => WARM.includes(p.bucket)), senior = ps.filter((p) => !WARM.includes(p.bucket));
      const counts = BUCKET_TYPES.map((b) => [b, ps.filter((p) => p.bucket === b).length] as const).filter(([, n]) => n);
      const lead = warm[0] ?? ps[0];
      return {
        score: Math.max(...ps.map((p) => p.score)) + 0.4 * ps.length,
        hub: {
          id: `c-${norm(ps[0].company!)}`,
          label: ps[0].company!,
          start: true,
          people: ps.map((p) => p.id),
          steps: warm.length && senior.length ? [warm.map((p) => p.id), senior.map((p) => p.id)] : [ps.map((p) => p.id)],
          note: `${plural(ps.length, "contact")} here (${counts.map(([b, n]) => `${n} ${(n === 1 ? BUCKET_INFO[b].name : GROUP_LABEL[b]).toLowerCase()}`).join(", ")}). ` +
            (warm.length && senior.length ? `Start with ${lead.name.split(" ")[0]} for a warm intro to ${senior[0].name}.` : `Start with ${lead.name.split(" ")[0]}.`),
        } satisfies MapHub,
      };
    })
    .sort((a, b) => b.score - a.score);

  const inCompanyHub = new Set(companyHubs.flatMap((c) => c.hub.people));
  const rest = people.filter((p) => !inCompanyHub.has(p.id));
  const typeHubs = BUCKET_TYPES.map((b) => ({ b, ps: rest.filter((p) => p.bucket === b) }))
    .filter((t) => t.ps.length)
    .map(({ b, ps }) => ({
      score: Math.max(...ps.map((p) => p.score)) + 0.2 * ps.length,
      hub: {
        id: `t-${b}`, label: GROUP_LABEL[b], start: false, people: ps.map((p) => p.id), steps: [ps.map((p) => p.id)],
        note: `${plural(ps.length, "person")} — ${BUCKET_INFO[b].hint.toLowerCase()}.`,
      } satisfies MapHub,
    }));

  // Up to 8 numbered starting points: best company hubs, topped up with the warmest groups.
  const ranked = [...companyHubs.slice(0, 8), ...typeHubs.sort((a, b) => b.score - a.score)];
  const hubs = ranked.map((r, i) => ({ ...r.hub, start: i < 8 && (r.hub.id.startsWith("c-") || i < 3) }));
  const start = hubs.filter((h) => h.start), other = hubs.filter((h) => !h.start);

  return {
    title: opts.title,
    me: opts.me,
    people: people.map((p) => ({ id: p.id, name: p.name, title: p.title, company: p.company, bucket: p.bucket, url: p.url, why: p.why })),
    hubs: [...start, ...companyHubs.slice(8).map((c) => ({ ...c.hub, start: false })), ...other].slice(0, 16),
  };
}

/** Flat rows for the CSV, in hub order. */
export function rowsFromSpec(spec: MapSpec) {
  const marks = hubMarks(spec.hubs);
  const byId = new Map(spec.people.map((p) => [p.id, p]));
  return spec.hubs.flatMap((h, i) =>
    h.people.map((id) => byId.get(id)).filter(Boolean).map((p) => ({
      hub: `${marks[i]} · ${h.full ?? h.label}`,
      ...p!,
    })),
  );
}
