// "You're in" email, sent once when a waitlist row is approved. Same look as
// supabase/templates/magic_link.html (table layout, inline styles for email clients).
const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const SANS = "'Hanken Grotesk','Helvetica Neue',Arial,sans-serif";
const LOGIN = "https://hireco.help/login";
const SETUP = "https://hireco.help/setup";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const STEPS = [
  "Sign in with this email address. We'll send you a one-time link.",
  "Install the Chrome extension and sync your LinkedIn connections. The dashboard walks you through it.",
  "Connect Hireco to your AI (Claude, Cursor, Codex and more), then ask: <span style=\"font-style:italic;color:#b9cdff;\">&ldquo;Who can get me hired as &hellip; at &hellip;?&rdquo;</span>",
];

export function approvedEmail(fullName: string | null) {
  const first = fullName?.trim().split(/\s+/)[0];
  const hello = first ? `${esc(first)}, you're` : "You're";
  const subject = "You're in: your Hireco access is ready";

  const steps = STEPS.map(
    (s, i) => `<tr>
      <td width="34" valign="top" style="font-family:${SERIF};font-size:22px;color:#4f6cb8;padding:0 0 10px;">0${i + 1}</td>
      <td valign="top" style="font-family:${SANS};font-size:14px;line-height:1.55;color:#dfe7ff;padding:3px 0 10px;">${s}</td>
    </tr>`,
  ).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Hanken+Grotesk:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; padding: 0; }
    a { text-decoration: none; }
    @media (max-width: 620px) { .px { padding-left: 24px !important; padding-right: 24px !important; } .h1 { font-size: 34px !important; } }
  </style>
</head>
<body style="margin:0;padding:0;background:#030817;" bgcolor="#030817">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your early access to Hireco is approved. Sign in and map your network in about ten minutes.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#030817" style="background:#030817;">
    <tr>
      <td align="center" style="padding:32px 12px 40px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="border-radius:22px 22px 0 0;overflow:hidden;line-height:0;font-size:0;" bgcolor="#071030">
              <a href="https://hireco.help" target="_blank">
                <img src="https://hireco.help/email/header.png" width="600" height="200" alt="Hireco: Early access" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:22px 22px 0 0;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="px" bgcolor="#0a1433" style="background:#0a1433;border:1px solid #1c2b57;border-top:0;border-radius:0 0 22px 22px;padding:40px 44px 36px;">
              <p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e7d6b0;">Access approved</p>
              <h1 class="h1" style="margin:0 0 16px;font-family:${SERIF};font-weight:300;font-size:40px;line-height:1.08;color:#ffffff;">
                ${hello} <span style="font-style:italic;color:#b9cdff;">in</span>.
              </h1>
              <p style="margin:0 0 30px;font-family:${SANS};font-size:15px;line-height:1.65;color:#b9c6ea;">
                Your early access to Hireco is ready. Map your LinkedIn network into the hiring managers, insiders and ex-coworkers who can get you hired, right inside your AI. Early access is free.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#2f5bea" style="border-radius:999px;background:#2f5bea;background-image:linear-gradient(135deg,#5a85ff 0%,#2f5bea 45%,#1a3aa6 100%);box-shadow:0 14px 30px -12px rgba(47,91,234,.9);">
                    <a href="${LOGIN}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:${SANS};font-size:15px;font-weight:500;letter-spacing:.3px;color:#ffffff;text-decoration:none;border-radius:999px;">Sign in to Hireco &rarr;</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 26px;">
                <tr><td height="1" style="height:1px;line-height:1px;font-size:0;background:#1c2b57;">&nbsp;</td></tr>
              </table>
              <p style="margin:0 0 14px;font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e7d6b0;">Ten minutes to your first map</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}</table>
              <p style="margin:22px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:#8a99c6;">
                Prefer to see every click? Follow the <a href="${SETUP}" target="_blank" style="color:#8fb0ff;text-decoration:underline;">step-by-step walkthrough with screenshots</a>.<br>
                Questions or stuck on a step? Just reply to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:24px 44px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#5d6b96;">
              You're getting this because you asked for early access to Hireco.<br><br>
              <a href="https://hireco.help" style="color:#8a99c6;text-decoration:none;">hireco.help</a> &nbsp;&middot;&nbsp; Early access
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${first ? `${first}, you're` : "You're"} in.

Your early access to Hireco is ready. Early access is free.

Sign in: ${LOGIN}

Ten minutes to your first map:
1. Sign in with this email address. We'll send you a one-time link.
2. Install the Chrome extension and sync your LinkedIn connections. The dashboard walks you through it.
3. Connect Hireco to your AI (Claude, Cursor, Codex and more), then ask: "Who can get me hired as ... at ...?"

Step-by-step walkthrough with screenshots: ${SETUP}

Questions or stuck on a step? Just reply to this email.

hireco.help`;

  return { subject, html, text };
}
