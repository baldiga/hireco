import { extRoute } from "@/lib/ext";
import { COPY, duration, getSettings } from "@/lib/limits";
import { adminClient } from "@/lib/supabase/admin";

type Incoming = {
  public_id: string;
  urn?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  picture_url?: string;
  connected_at?: string;
};

const HOUR = 3600_000;

/** Why a new sync shouldn't start now, or null. Auto-syncs pause for members who stopped using Hireco. */
async function syncBlocked(userId: string, auto: boolean) {
  if ((await getSettings()).paused) return COPY.paused;
  const db = adminClient();
  if (auto) {
    const { data: p } = await db.from("profiles").select("last_active_at").eq("id", userId).maybeSingle();
    if (p && Date.now() - Date.parse(p.last_active_at) > 14 * 24 * HOUR) return "Daily sync is paused while you're away. Press Sync now whenever you're back.";
  }
  const { data: last } = await db.from("sync_runs").select("finished_at").eq("user_id", userId).eq("status", "done")
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  const since = last?.finished_at ? Date.now() - Date.parse(last.finished_at) : Infinity;
  if (since < HOUR) return COPY.synced(duration(since), duration(HOUR - since));
  return null;
}

// Receives connection pages during a sync. First call (no run_id) opens a sync run.
// { check: true } only asks whether a sync may start (extension 0.7+ asks before reading LinkedIn).
export const POST = extRoute(async (userId, req) => {
  const body = (await req.json()) as { run_id?: string; done?: boolean; error?: string; check?: boolean; auto?: boolean; connections?: Incoming[] };
  const db = adminClient();

  if (body.check) {
    const message = await syncBlocked(userId, !!body.auto);
    return message ? { skip: true, message } : { ok: true };
  }

  let runId = body.run_id;
  if (!runId) {
    const message = await syncBlocked(userId, false);
    if (message) throw new Error(message);
    const { data, error } = await db.from("sync_runs").insert({ user_id: userId, kind: "connections" }).select("id").single();
    if (error) throw error;
    runId = data.id as string;
  }

  const rows = (body.connections ?? [])
    .filter((c) => c.public_id)
    .map((c) => ({
      user_id: userId,
      public_id: c.public_id,
      urn: c.urn ?? null,
      first_name: c.first_name ?? null,
      last_name: c.last_name ?? null,
      headline: c.headline ?? null,
      picture_url: c.picture_url ?? null,
      connected_at: c.connected_at ?? null,
      updated_at: new Date().toISOString(),
    }));
  if (rows.length) {
    const { error } = await db.from("connections").upsert(rows, { onConflict: "user_id,public_id" });
    if (error) throw error;
  }

  const { data: run } = await db.from("sync_runs").select("item_count").eq("id", runId).single();
  await db
    .from("sync_runs")
    .update({
      item_count: (run?.item_count ?? 0) + rows.length,
      ...(body.done || body.error
        ? { status: body.error ? "error" : "done", error: body.error ?? null, finished_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", runId)
    .eq("user_id", userId);

  return { run_id: runId, received: rows.length };
});
