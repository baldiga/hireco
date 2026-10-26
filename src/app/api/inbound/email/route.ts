import { Resend } from "resend";

// Resend "email.received" webhook: forwards mail sent to any @hireco.help address (e.g. hello@)
// to FORWARD_TO, keeping the original message and attachments.
export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const payload = await req.text();

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
    });
  } catch {
    return new Response("invalid signature", { status: 401 });
  }

  if (event.type !== "email.received") return Response.json({ ignored: event.type });

  const emailId = event.data.email_id;
  const { data, error } = await resend.emails.receiving.forward(
    { emailId, to: process.env.FORWARD_TO!, from: "Hireco <hello@hireco.help>" },
    // Webhook retries must not forward the same message twice.
    { idempotencyKey: `forward-${emailId}` },
  );
  if (error) {
    console.error("forward failed", emailId, error);
    return new Response(error.message, { status: 500 });
  }
  return Response.json({ forwarded: data?.id });
}
