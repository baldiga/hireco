import { Resend } from "resend";
import { normEmail } from "@/lib/access";
import { approvedEmail } from "@/lib/emails/approved";
import { adminClient } from "@/lib/supabase/admin";

// Called by the waitlist_approved DB trigger. No secret needed: it only ever sends the
// "you're in" email to a row that is approved and hasn't had it yet, and claims the row first.
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== "string") return new Response("email required", { status: 400 });

  const db = adminClient();
  const { data: row } = await db
    .from("waitlist")
    .update({ approved_email_sent_at: new Date().toISOString() })
    .eq("email", normEmail(email))
    .eq("approved", true)
    .is("approved_email_sent_at", null)
    .select("email, full_name")
    .maybeSingle();
  if (!row) return Response.json({ skipped: true });

  const { subject, html, text } = approvedEmail(row.full_name);
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send(
    { from: "Hireco <hello@hireco.help>", to: row.email, subject, html, text },
    { idempotencyKey: `approved-${row.email}` },
  );
  if (error) {
    // Release the claim so flipping `approved` again retries.
    await db.from("waitlist").update({ approved_email_sent_at: null }).eq("email", row.email);
    console.error("approved email failed", row.email, error);
    return new Response(error.message, { status: 500 });
  }
  return Response.json({ sent: data?.id });
}
