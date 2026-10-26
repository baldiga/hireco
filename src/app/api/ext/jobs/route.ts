import { extRoute } from "@/lib/ext";
import { adminClient } from "@/lib/supabase/admin";

// Claims the next pending company searches for the extension to run.
export const GET = extRoute(async (userId) => {
  const db = adminClient();
  const { data, error } = await db
    .from("company_searches")
    .select("id, company_id, company_name, relation")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("requested_at")
    .limit(3);
  if (error) throw error;
  if (data.length) {
    await db
      .from("company_searches")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("user_id", userId)
      .in("id", data.map((j) => j.id));
  }
  return { jobs: data };
});

// Receives a finished search.
export const POST = extRoute(async (userId, req) => {
  const r = (await req.json()) as { id: string; company_id?: string; company_name?: string; public_ids?: string[]; error?: string };
  const { error } = await adminClient()
    .from("company_searches")
    .update({
      status: r.error ? "error" : "done",
      error: r.error ?? null,
      public_ids: r.public_ids ?? [],
      ...(r.company_id ? { company_id: r.company_id } : {}),
      finished_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", r.id);
  if (error) throw error;
  return { ok: true };
});
