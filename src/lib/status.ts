import "server-only";
import { getQuota } from "./enrich";
import { adminClient } from "./supabase/admin";

export async function getStatus(userId: string) {
  const db = adminClient();
  const [connections, lastSync, profile, quota] = await Promise.all([
    db.from("connections").select("id", { count: "exact", head: true }).eq("user_id", userId).then((r) => r.count ?? 0),
    db.from("sync_runs").select("status, item_count, started_at, finished_at, error").eq("user_id", userId)
      .order("started_at", { ascending: false }).limit(1).maybeSingle().then((r) => r.data),
    db.from("profiles").select("email, full_name, linkedin_public_id").eq("id", userId).maybeSingle().then((r) => r.data),
    getQuota(userId),
  ]);

  return {
    email: profile?.email ?? null,
    linkedin_account: profile?.linkedin_public_id ? { name: profile.full_name, public_id: profile.linkedin_public_id } : null,
    connections,
    premium_enrichment: quota,
    last_sync: lastSync,
  };
}
