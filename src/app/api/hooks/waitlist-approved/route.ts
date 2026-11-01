import { sendApprovedEmail } from "@/lib/email";

// Called by the waitlist_approved DB trigger. No secret needed: it only ever sends the
// "you're in" email to a row that is approved and hasn't had it yet, and claims the row first.
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== "string") return new Response("email required", { status: 400 });
  try {
    return Response.json(await sendApprovedEmail(email));
  } catch (e) {
    console.error("approved email failed", email, e);
    return new Response(e instanceof Error ? e.message : "send failed", { status: 500 });
  }
}
