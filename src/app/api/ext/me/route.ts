import { extRoute } from "@/lib/ext";
import { adminClient } from "@/lib/supabase/admin";

// The extension reports the signed-in LinkedIn member's own profile.
export const POST = extRoute(async (userId, req) => {
  const p = await req.json();
  const { error } = await adminClient()
    .from("profiles")
    .update({
      linkedin_public_id: p.public_id,
      linkedin_urn: p.urn,
      full_name: p.full_name,
      headline: p.headline,
      positions: p.positions ?? [],
      educations: p.educations ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
  return { ok: true };
});
