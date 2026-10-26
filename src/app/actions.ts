"use server";

import { accessFor, normEmail } from "@/lib/access";
import { SITE_URL } from "@/lib/exports";
import { adminClient } from "@/lib/supabase/admin";
import { serverClient } from "@/lib/supabase/server";

export type FormState = { ok: boolean; message: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(_prev: FormState, form: FormData): Promise<FormState> {
  const email = normEmail(String(form.get("email") ?? ""));
  const fullName = String(form.get("name") ?? "").trim();
  const linkedin = String(form.get("linkedin") ?? "").trim();
  if (!EMAIL.test(email)) return { ok: false, message: "Please enter a valid email." };
  if (!fullName) return { ok: false, message: "Please add your name." };
  if (!/linkedin\.com\/in\/[^/?#\s]+/i.test(linkedin)) return { ok: false, message: "Please paste your LinkedIn profile URL (linkedin.com/in/…)." };

  const { error } = await adminClient()
    .from("waitlist")
    .upsert({ email, full_name: fullName, linkedin_url: linkedin }, { onConflict: "email", ignoreDuplicates: true });
  if (error) return { ok: false, message: "Something went wrong. Please try again." };
  return { ok: true, message: "You're on the list. We'll email you as soon as your access is approved." };
}

export async function requestSignIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = normEmail(String(form.get("email") ?? ""));
  if (!EMAIL.test(email)) return { ok: false, message: "Please enter a valid email." };

  const access = await accessFor(email);
  if (access === "unknown") return { ok: false, message: "We don't have this email yet — request early access first." };
  if (access === "waitlisted") return { ok: false, message: "You're on the waitlist. We'll email you when your access is approved." };

  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${SITE_URL}/auth/callback` } });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: `Check ${email} for your sign-in link.` };
}
