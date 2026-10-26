import "server-only";
import { autoSpec, type MapSpec } from "./mapSpec";
import { adminClient } from "./supabase/admin";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hireco-seven.vercel.app";

export type ExportRow = {
  bucket: string;
  name: string;
  title: string | null;
  company: string | null;
  url: string;
  why: string;
  enriched: boolean;
};

export const BUCKET_LABELS: Record<string, string> = {
  hiring_managers: "Hiring manager",
  decision_makers: "Decision maker",
  insiders: "Insider",
  recruiters: "Recruiter",
  introducers: "Introducer",
  ex_coworkers: "Ex-coworker",
  search: "Match",
};

/** Saves a result snapshot; returns links the user can open without signing in. */
export async function saveExport(userId: string, title: string, rows: ExportRow[], spec?: MapSpec) {
  const { data, error } = await adminClient().from("exports").insert({ user_id: userId, title, rows, spec: spec ?? null }).select("id").single();
  if (error) throw error;
  return { csv_url: `${SITE_URL}/api/export/${data.id}`, map_url: `${SITE_URL}/map/${data.id}` };
}

export const RETENTION_DAYS = 14;
const cutoff = () => new Date(Date.now() - RETENTION_DAYS * 86400_000).toISOString();

/** The user's maps that haven't expired, newest first. */
export async function listMaps(userId: string, limit = 20) {
  const { data, error } = await adminClient()
    .from("exports")
    .select("id, title, created_at, people:spec->people")
    .eq("user_id", userId)
    .gte("created_at", cutoff())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((m) => ({
    id: m.id as string,
    title: m.title as string,
    created_at: m.created_at as string,
    people: Array.isArray(m.people) ? m.people.length : null,
    expires_at: new Date(Date.parse(m.created_at) + RETENTION_DAYS * 86400_000).toISOString(),
    map_url: `${SITE_URL}/map/${m.id}`,
    csv_url: `${SITE_URL}/api/export/${m.id}`,
  }));
}

export async function loadExport(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await adminClient().from("exports").select("title, rows, spec, created_at").eq("id", id).gte("created_at", cutoff()).maybeSingle();
  if (!data) return null;
  const rows = data.rows as ExportRow[];
  return {
    title: data.title as string,
    created_at: data.created_at as string,
    rows,
    spec: (data.spec as MapSpec | null) ?? autoSpec(rows, { title: data.title, me: "You" }),
  };
}

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote everything; neutralize spreadsheet formula injection.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export function toCsv(rows: ExportRow[]) {
  const header = ["Path", "Name", "Title", "Company", "Why they matter", "LinkedIn", "Work history checked"];
  const lines = rows.map((r) => [BUCKET_LABELS[r.bucket] ?? r.bucket, r.name, r.title, r.company, r.why, r.url, r.enriched ? "yes" : "no"].map(cell).join(","));
  return [header.map(cell).join(","), ...lines].join("\r\n");
}
