import { sendApprovedEmail, sendEmail, sendSignInLink } from "@/lib/email";
import { capacity } from "@/lib/limits";
import { adminClient } from "@/lib/supabase/admin";

// Vercel Cron, once a day (Hobby allows one run a day). Lets people in from the queue,
// sends the links and emails that waited for today's email budget, and reports usage.
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response("unauthorized", { status: 401 });
  const db = adminClient();
  const report = { let_in: 0, welcome_sent: 0, links_sent: 0, waiting_for_budget: 0 };

  // 1. Free spots go to the queue, oldest first. The DB trigger sends their "you're in" email.
  const cap = await capacity();
  const spots = cap.full ? 0 : cap.max_active - cap.active;
  if (spots > 0) {
    const { data: next } = await db.from("waitlist").select("email").eq("approved", false).eq("source", "signup")
      .order("created_at").limit(spots);
    if (next?.length) {
      await db.from("waitlist").update({ approved: true }).in("email", next.map((r) => r.email));
      report.let_in = next.length;
    }
  }

  // 2. "You're in" emails that ran out of budget earlier (or are still on their way from the trigger).
  const { data: unwelcomed } = await db.from("waitlist").select("email").eq("approved", true).is("approved_email_sent_at", null).order("created_at");
  for (const { email } of unwelcomed ?? []) {
    const r = await sendApprovedEmail(email).catch((e) => (console.error(e), { sent: false as const }));
    if ("skipped" in r) continue;
    if (!r.sent) { report.waiting_for_budget++; continue; }
    report.welcome_sent++;
  }

  // 3. Sign-up links that waited for today's budget.
  const { data: pending } = await db.from("waitlist").select("email, full_name").eq("link_pending", true).order("created_at");
  for (const m of pending ?? []) {
    const r = await sendSignInLink(m.email, "signup", m.full_name).catch((e) => (console.error(e), { sent: false as const }));
    if (!r.sent) { report.waiting_for_budget++; continue; }
    await db.from("waitlist").update({ link_pending: false }).eq("email", m.email);
    report.links_sent++;
  }

  // 4. Daily report for the operator.
  const to = process.env.REPORT_EMAIL;
  if (to) {
    const yesterday = new Date(Date.now() - 86400_000);
    yesterday.setUTCHours(0, 0, 0, 0);
    const [{ data: usage }, { count: queued }, { count: signups }, after] = await Promise.all([
      db.from("usage_counters").select("key, count").eq("window_start", yesterday.toISOString()).in("key", ["email", "email:new"]).eq("subject", "global"),
      db.from("waitlist").select("id", { count: "exact", head: true }).eq("approved", false).eq("source", "signup"),
      db.from("waitlist").select("id", { count: "exact", head: true }).eq("source", "signup").gte("created_at", yesterday.toISOString()),
      capacity(),
    ]);
    const { data: tools } = await db.from("usage_counters").select("count").eq("key", "tool:all").eq("window_start", yesterday.toISOString());
    const toolCalls = (tools ?? []).reduce((n, r) => n + r.count, 0);
    const emails = Object.fromEntries((usage ?? []).map((u) => [u.key, u.count]));
    const lines = [
      `Members: ${after.active} of ${after.max_active}${after.full ? " (FULL)" : ""}`,
      `Queue: ${queued ?? 0} waiting`,
      `Database: ${(after.db_bytes / 1e6).toFixed(0)} MB of 500 MB`,
      `Sign-ups since yesterday: ${signups ?? 0}`,
      `Emails yesterday: ${emails.email ?? 0} (new members: ${emails["email:new"] ?? 0})`,
      `MCP tool calls yesterday: ${toolCalls}`,
      `Today so far: let in ${report.let_in}, welcomes ${report.welcome_sent}, links ${report.links_sent}, waiting for budget ${report.waiting_for_budget}`,
      "",
      "Vercel usage: https://vercel.com/dashboard (Usage tab)",
    ];
    await sendEmail("system", to, () => ({
      subject: `Hireco daily: ${after.active} members, ${queued ?? 0} queued`,
      text: lines.join("\n"),
      html: `<pre style="font:14px/1.6 ui-monospace,Menlo,monospace">${lines.join("\n")}</pre>`,
    })).catch(console.error);
  }

  return Response.json(report);
}
