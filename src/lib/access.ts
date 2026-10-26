import "server-only";
import { adminClient } from "./supabase/admin";

export const normEmail = (email: string) => email.trim().toLowerCase();

/** "approved" | "waitlisted" | "unknown" */
export async function accessFor(email: string | null | undefined) {
  if (!email) return "unknown" as const;
  const { data } = await adminClient().from("waitlist").select("approved").eq("email", normEmail(email)).maybeSingle();
  return data ? (data.approved ? ("approved" as const) : ("waitlisted" as const)) : ("unknown" as const);
}
