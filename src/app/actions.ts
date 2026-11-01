"use server";

import { headers } from "next/headers";
import { accessFor, normEmail, queuePosition } from "@/lib/access";
import { sendSignInLink } from "@/lib/email";
import { TERMS_VERSION } from "@/lib/legal";
import { capacity, COPY, getSettings, hit, until } from "@/lib/limits";
import { adminClient } from "@/lib/supabase/admin";

export type FormState = { ok: boolean; message: string; queued?: boolean } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINKEDIN = /linkedin\.com\/in\/[^/?#\s]+/i;

async function request() {
  const h = await headers();
  return {
    origin: `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`,
    ip: h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown",
  };
}

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const email = normEmail(String(form.get("email") ?? ""));
  const fullName = String(form.get("name") ?? "").trim();
  const linkedin = String(form.get("linkedin") ?? "").trim();
  const marketing = form.get("marketing") === "on";
  // Bots fill every field, people never see this one.
  if (form.get("website")) return { ok: true, message: `Check ${email} for your link to confirm and sign in.` };
  if (!fullName) return { ok: false, message: "Please add your name." };
  if (!EMAIL.test(email)) return { ok: false, message: "Please enter a valid email." };
  if (linkedin && !LINKEDIN.test(linkedin)) return { ok: false, message: "That doesn't look like a LinkedIn profile URL (linkedin.com/in/…)." };
  if (form.get("terms") !== "on") return { ok: false, message: "Please agree to the Terms and Privacy Policy to continue." };

  const { origin, ip } = await request();
  if (!(await hit(`ip:${ip}`, "signup", 5, 3600)).allowed) return { ok: false, message: COPY.burst };
  if ((await getSettings()).paused) return { ok: false, message: COPY.paused };

  const db = adminClient();
  const now = new Date().toISOString();
  const consent = {
    terms_version: TERMS_VERSION,
    terms_accepted_at: now,
    marketing_opt_in: marketing,
    marketing_opt_in_at: marketing ? now : null,
  };
  const { data: existing } = await db.from("waitlist").select("approved, source").eq("email", email).maybeSingle();

  // Already a member: treat it as a sign-in.
  if (existing?.approved) {
    await db.from("waitlist").update(consent).eq("email", email);
    return emailLink(email, "signin", fullName, origin);
  }

  const approved = !(await capacity()).full;
  const row = {
    email,
    full_name: fullName,
    linkedin_url: linkedin || null,
    source: "signup",
    approved,
    // Members let in right away get the sign-in link below, not the "you're in" email.
    approved_email_sent_at: approved ? now : null,
    ...consent,
  };
  const { error } = existing
    ? await db.from("waitlist").update(row).eq("email", email)
    : await db.from("waitlist").insert(row);
  if (error) return { ok: false, message: "Something went wrong. Please try again." };

  if (!approved) return { ok: true, queued: true, message: COPY.full(await queuePosition(email)) };
  return emailLink(email, "signup", fullName, origin);
}

async function emailLink(email: string, kind: "signup" | "signin", fullName: string | null, origin: string): Promise<FormState> {
  try {
    const r = await sendSignInLink(email, kind, fullName, origin);
    if (r.sent) return { ok: true, message: `Check ${email} for your ${kind === "signup" ? "link to confirm and sign in" : "sign-in link"}.` };
    if (kind === "signup") {
      // The daily job sends it tomorrow morning.
      await adminClient().from("waitlist").update({ link_pending: true }).eq("email", email);
      return { ok: true, message: COPY.signupBudget };
    }
    return { ok: false, message: COPY.signinBudget(until(r.resetAt)) };
  } catch (e) {
    console.error("sign-in link failed", email, e);
    return { ok: false, message: "We couldn't send your link just now. Please try again in a minute." };
  }
}

export async function requestSignIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = normEmail(String(form.get("email") ?? ""));
  if (!EMAIL.test(email)) return { ok: false, message: "Please enter a valid email." };

  const access = await accessFor(email);
  if (access === "unknown") return { ok: false, message: "We don't have an account for this email yet. It's free: use Create your free account below." };
  if (access === "waitlisted") return { ok: false, message: "Good news: Hireco is open now. Use Create your free account below with this email to get in." };
  if (access === "queued") return { ok: false, queued: true, message: COPY.full(await queuePosition(email)) };

  const { origin, ip } = await request();
  if (!(await hit(`ip:${ip}`, "signin", 10, 3600)).allowed || !(await hit(`email:${email}`, "signin", 5, 3600)).allowed)
    return { ok: false, message: COPY.burst };
  return emailLink(email, "signin", null, origin);
}
