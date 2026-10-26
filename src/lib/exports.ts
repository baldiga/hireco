import "server-only";
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
export async function saveExport(userId: string, title: string, rows: ExportRow[]) {
  const { data, error } = await adminClient().from("exports").insert({ user_id: userId, title, rows }).select("id").single();
  if (error) throw error;
  return { csv_url: `${SITE_URL}/api/export/${data.id}`, map_url: `${SITE_URL}/map/${data.id}` };
}

export async function loadExport(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await adminClient().from("exports").select("title, rows, created_at").eq("id", id).maybeSingle();
  return data as { title: string; rows: ExportRow[]; created_at: string } | null;
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
