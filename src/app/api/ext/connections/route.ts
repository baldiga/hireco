import { extRoute } from "@/lib/ext";
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

// Receives connection pages during a sync. First call (no run_id) opens a sync run.
export const POST = extRoute(async (userId, req) => {
  const body = (await req.json()) as { run_id?: string; done?: boolean; error?: string; connections?: Incoming[] };
  const db = adminClient();

  let runId = body.run_id;
  if (!runId) {
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
