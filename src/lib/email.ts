import "server-only";
import { Resend } from "resend";
import { normEmail } from "./access";
import { approvedEmail } from "./emails/approved";
import { signInEmail } from "./emails/signIn";
import { SITE_URL } from "./exports";
import { getSettings, hit } from "./limits";
import { adminClient } from "./supabase/admin";

// Every email goes through here, so one daily budget covers Resend's free 100 a day.
// "signup" and "approved" share a smaller budget, so sign-in links for existing members
// keep working on a day lots of people join.

type Kind = "signin" | "signup" | "approved" | "system";
type Message = { subject: string; html: string; text: string };
export type SendResult = { sent: true } | { sent: false; resetAt: string };

const FROM = process.env.EMAIL_FROM ?? "Hireco <hello@hireco.help>";
const FROM_LOGIN = process.env.EMAIL_FROM_LOGIN ?? "Hireco <login@hireco.help>";

async function takeBudget(kind: Kind) {
  const s = await getSettings();
  if (kind === "signup" || kind === "approved") {
    const r = await hit("global", "email:new", s.signup_email_budget);
    if (!r.allowed) return r;
  }
  // The daily report is always sent, but still counted.
  return hit("global", "email", kind === "system" ? 1_000_000 : s.email_daily_budget);
}

/** Sends if today's budget allows. `build` runs only then (e.g. to mint a sign-in link). */
export async function sendEmail(kind: Kind, to: string, build: () => Promise<Message> | Message, idempotencyKey?: string): Promise<SendResult> {
  const budget = await takeBudget(kind);
  if (!budget.allowed) return { sent: false, resetAt: budget.resetAt };
  const { subject, html, text } = await build();
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send(
    { from: kind === "signin" || kind === "signup" ? FROM_LOGIN : FROM, to, subject, html, text },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) throw new Error(error.message);
  return { sent: true };
}

/** Mints a one-time sign-in link (creating the auth user if needed) and emails it. */
export async function sendSignInLink(email: string, kind: "signup" | "signin", fullName?: string | null, origin = SITE_URL) {
  return sendEmail(kind, email, async () => {
    const { data, error } = await adminClient().auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data.properties?.hashed_token) throw new Error(error?.message ?? "could not create sign-in link");
    const link = `${origin}/auth/confirm?token_hash=${data.properties.hashed_token}&type=email`;
    return signInEmail({ link, email, kind, fullName });
  });
}

/** The one-time "you're in" email for a member let in from the queue (or approved by hand). */
export async function sendApprovedEmail(email: string) {
  const db = adminClient();
  // Claim the row first so the DB trigger and the daily job never both send it.
  const { data: row } = await db
    .from("waitlist")
    .update({ approved_email_sent_at: new Date().toISOString() })
    .eq("email", normEmail(email))
    .eq("approved", true)
    .is("approved_email_sent_at", null)
    .select("email, full_name")
    .maybeSingle();
  if (!row) return { skipped: true };

  const release = () => db.from("waitlist").update({ approved_email_sent_at: null }).eq("email", row.email);
  try {
    const r = await sendEmail("approved", row.email, () => approvedEmail(row.full_name), `approved-${row.email}`);
    // Out of budget: the daily job picks it up tomorrow.
    if (!r.sent) await release();
    return r;
  } catch (e) {
    await release();
    throw e;
  }
}
