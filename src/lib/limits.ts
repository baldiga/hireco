import "server-only";
import { adminClient } from "./supabase/admin";

// Hireco runs on free tiers (Vercel Hobby, Supabase Free, Resend Free). These limits keep it
// up when lots of people join, and every message reads as good news, not an error.

export type Settings = {
  max_active_users: number;
  max_db_bytes: number;
  email_daily_budget: number;
  signup_email_budget: number;
  paused: boolean;
  tool_limits: Record<string, number>;
};

const DAY = 86400;
let cached: { at: number; value: Settings } | null = null;

export async function getSettings(): Promise<Settings> {
  if (cached && Date.now() - cached.at < 60_000) return cached.value;
  const { data, error } = await adminClient().from("app_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  cached = { at: Date.now(), value: data as Settings };
  return cached.value;
}

/** Counts one hit in a fixed UTC-aligned window. */
export async function hit(subject: string, key: string, limit: number, windowSeconds = DAY, amount = 1) {
  const { data, error } = await adminClient().rpc("hit", {
    p_subject: subject, p_key: key, p_limit: limit, p_window_seconds: windowSeconds, p_amount: amount,
  });
  if (error) throw error;
  const row = (data as { allowed: boolean; used: number; reset_at: string }[])[0];
  return { allowed: row.allowed, used: row.used, resetAt: row.reset_at };
}

/** "5 hours", "40 minutes" */
export function duration(ms: number) {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"}`;
  const h = Math.ceil(min / 60);
  return `${h} hour${h === 1 ? "" : "s"}`;
}
export const until = (iso: string) => duration(Date.parse(iso) - Date.now());

export const COPY = {
  paused: "Hireco is getting more love than our free servers planned for. We're catching our breath and will be back shortly.",
  tool: (n: number, what: string, reset: string) =>
    `You've been busy: ${n} ${what} today, the daily max on free Hireco. Your network isn't going anywhere. The limit resets in ${reset}.`,
  burst: "Fast fingers! Give it a minute and try again.",
  signupBudget:
    "You picked a busy day to join. So many people signed up today that we've hit our daily invite limit. Your account is saved, and your sign-in link arrives tomorrow morning.",
  signinBudget: (reset: string) =>
    `Our mailroom is taking a breather for today. Already set up? Your extension and AI keep working as usual. New sign-in links go out again in ${reset}.`,
  full: (position: number) =>
    `Hireco is full right now, which is honestly a great problem to have. You're #${position} in line, and we'll email you the moment a spot opens up.`,
  synced: (ago: string, next: string) => `Your network was synced ${ago} ago, so it's fresh. Next manual sync in ${next}.`,
  enrichInAgent:
    "Premium enrichment runs in your own AI: connect a LinkedIn data tool like the Zooq or Apify MCP with your own key (it stays in your AI app, Hireco never sees it), and I'll save the results to Hireco. Two-minute setup: hireco.help/dashboard#enrich",
};

const TOOL_WORDS: Record<string, string> = {
  find_hiring_paths: "hiring-path searches",
  search_my_network: "network searches",
  publish_map: "maps",
  enrich_prospects: "enrichment runs",
  import_profiles: "profile imports",
  all: "Hireco requests",
};

/** null when the call may go ahead, otherwise the message for the user. */
export async function toolLimit(userId: string, tool: string): Promise<string | null> {
  const s = await getSettings();
  if (s.paused) return COPY.paused;
  for (const key of [tool, "all"]) {
    const limit = s.tool_limits[key];
    if (!limit) continue;
    const r = await hit(userId, `tool:${key}`, limit);
    if (!r.allowed) return COPY.tool(limit, TOOL_WORDS[key] ?? "requests", until(r.resetAt));
  }
  return null;
}

/** Marks the member as active (at most one write an hour). Inactive members' data is cleared after 45 days. */
export async function touchActive(userId: string) {
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  await adminClient().from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", userId).lt("last_active_at", hourAgo);
}

export async function capacity() {
  const { data, error } = await adminClient().rpc("capacity");
  if (error) throw error;
  return (data as { active: number; max_active: number; db_bytes: number; full: boolean }[])[0];
}
