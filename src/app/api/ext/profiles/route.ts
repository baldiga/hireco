import { currentPosition, extRoute } from "@/lib/ext";
import type { Position } from "@/lib/network";
import { adminClient } from "@/lib/supabase/admin";

type Enriched = {
  public_id: string;
  headline?: string;
  location?: string;
  positions?: Position[];
  educations?: unknown[];
  error?: string;
};

// Receives full profiles (work history) fetched by the extension.
export const POST = extRoute(async (userId, req) => {
  const { profiles } = (await req.json()) as { profiles: Enriched[] };
  const db = adminClient();
  const now = new Date().toISOString();

  for (const p of profiles ?? []) {
    const current = currentPosition(p.positions);
    const update = p.error
      ? { enrich_error: p.error, updated_at: now }
      : {
          positions: p.positions ?? [],
          educations: p.educations ?? [],
          location: p.location ?? null,
          ...(p.headline ? { headline: p.headline } : {}),
          current_title: current?.title ?? null,
          current_company: current?.company ?? null,
          enriched_at: now,
          enrich_priority: 0,
          updated_at: now,
        };
    const { error } = await db.from("connections").update(update).eq("user_id", userId).eq("public_id", p.public_id);
    if (error) throw error;
  }
  return { ok: true, saved: profiles?.length ?? 0 };
});
