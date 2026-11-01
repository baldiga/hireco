import "server-only";
import { adminClient } from "./supabase/admin";

export const normEmail = (email: string) => email.trim().toLowerCase();

/**
 * "approved"   member, may sign in
 * "queued"     signed up while Hireco was full, waiting for a spot
 * "waitlisted" asked for early access before sign-up opened
 * "unknown"    no account
 */
export async function accessFor(email: string | null | undefined) {
  if (!email) return "unknown" as const;
  const { data } = await adminClient().from("waitlist").select("approved, source").eq("email", normEmail(email)).maybeSingle();
  if (!data) return "unknown" as const;
  if (data.approved) return "approved" as const;
  return data.source === "signup" ? ("queued" as const) : ("waitlisted" as const);
}

/** 1-based place in the queue for a member who signed up while Hireco was full. */
export async function queuePosition(email: string) {
  const db = adminClient();
  const { data: me } = await db.from("waitlist").select("created_at").eq("email", normEmail(email)).maybeSingle();
  if (!me) return 1;
  const { count } = await db
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .eq("approved", false)
    .eq("source", "signup")
    .lt("created_at", me.created_at);
  return (count ?? 0) + 1;
}
