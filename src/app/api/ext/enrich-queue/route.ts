import { extRoute } from "@/lib/ext";
import { adminClient } from "@/lib/supabase/admin";

// Next connections the extension should fetch full profiles for. Priority first, then newest.
export const GET = extRoute(async (userId, req) => {
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? 5), 25);
  const { data, error } = await adminClient()
    .from("connections")
    .select("public_id")
    .eq("user_id", userId)
    .is("enriched_at", null)
    .is("enrich_error", null)
    .order("enrich_priority", { ascending: false })
    .order("connected_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return { public_ids: data.map((r) => r.public_id) };
});
