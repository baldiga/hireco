import "server-only";
import { adminClient } from "./supabase/admin";

export async function getStatus(userId: string) {
  const db = adminClient();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const base = () => db.from("connections").select("id", { count: "exact", head: true }).eq("user_id", userId);

  const [connections, enriched, failed, lastSync, profile] = await Promise.all([
    count(base()),
    count(base().not("enriched_at", "is", null)),
    count(base().not("enrich_error", "is", null)),
    db.from("sync_runs").select("status, item_count, started_at, finished_at, error").eq("user_id", userId)
      .order("started_at", { ascending: false }).limit(1).maybeSingle().then((r) => r.data),
    db.from("profiles").select("email, full_name, linkedin_public_id").eq("id", userId).maybeSingle().then((r) => r.data),
  ]);

  return {
    email: profile?.email ?? null,
    linkedin_account: profile?.linkedin_public_id ? { name: profile.full_name, public_id: profile.linkedin_public_id } : null,
    connections,
    enriched_with_work_history: enriched,
    enrichment_failed: failed,
    last_sync: lastSync,
  };
}
