// One-time sign-in link. "signup" is the first one a new member gets, "signin" every later one.
// Same look as the other emails (table layout, inline styles for email clients).
const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const SANS = "'Hanken Grotesk','Helvetica Neue',Arial,sans-serif";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const STEPS = [
  "Install the Chrome extension and sync your connections",
  "Connect Hireco to your AI (Claude, Cursor, Codex and more)",
  "Ask: <span style=\"font-style:italic;color:#b9cdff;\">&ldquo;Who can get me hired as &hellip; at &hellip;?&rdquo;</span>",
];

export function signInEmail({ link, email, kind, fullName }: { link: string; email: string; kind: "signup" | "signin"; fullName?: string | null }) {
  const first = fullName?.trim().split(/\s+/)[0];
  const welcome = kind === "signup";
  const subject = welcome ? "Welcome to Hireco: confirm your email" : "Your Hireco sign-in link";
  const eyebrow = welcome ? "Welcome" : "Sign in";
  const headline = welcome
    ? `${first ? `${esc(first)}, your` : "Your"} network is <span style="font-style:italic;color:#b9cdff;">ready to map</span>.`
    : `Your network is <span style="font-style:italic;color:#b9cdff;">waiting</span>.`;
  const intro = welcome
    ? "Thanks for joining Hireco. Confirm your email with the button below and you're in. The link works once and expires in an hour."
    : "Here's your one-time link to sign in to Hireco. It works once and expires in an hour.";
  const cta = welcome ? "Confirm and sign in &rarr;" : "Sign in to Hireco &rarr;";

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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${welcome ? "Confirm your email to start mapping your network." : "Your one-time link to sign in to Hireco. It expires in an hour."}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#030817" style="background:#030817;">
    <tr>
      <td align="center" style="padding:32px 12px 40px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="border-radius:22px 22px 0 0;overflow:hidden;line-height:0;font-size:0;" bgcolor="#071030">
              <a href="https://hireco.help" target="_blank">
                <img src="https://hireco.help/email/header.png" width="600" height="200" alt="Hireco" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:22px 22px 0 0;">
              </a>
            </td>
          </tr>
          <tr>
            <td class="px" bgcolor="#0a1433" style="background:#0a1433;border:1px solid #1c2b57;border-top:0;border-radius:0 0 22px 22px;padding:40px 44px 36px;">
              <p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${welcome ? "#e7d6b0" : "#8a99c6"};">${eyebrow}</p>
              <h1 class="h1" style="margin:0 0 16px;font-family:${SERIF};font-weight:300;font-size:40px;line-height:1.08;color:#ffffff;">${headline}</h1>
              <p style="margin:0 0 30px;font-family:${SANS};font-size:15px;line-height:1.65;color:#b9c6ea;">${intro}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#2f5bea" style="border-radius:999px;background:#2f5bea;background-image:linear-gradient(135deg,#5a85ff 0%,#2f5bea 45%,#1a3aa6 100%);box-shadow:0 14px 30px -12px rgba(47,91,234,.9);">
                    <a href="${link}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:${SANS};font-size:15px;font-weight:500;letter-spacing:.3px;color:#ffffff;text-decoration:none;border-radius:999px;">${cta}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:26px 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#6c7aa6;">
                Button not working? Paste this into your browser:<br>
                <a href="${link}" style="color:#8fb0ff;word-break:break-all;text-decoration:underline;">${link}</a>
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:34px 0 26px;">
                <tr><td height="1" style="height:1px;line-height:1px;font-size:0;background:#1c2b57;">&nbsp;</td></tr>
              </table>
              <p style="margin:0 0 14px;font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#e7d6b0;">Then, in ten minutes</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}</table>
              <p style="margin:18px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:#8a99c6;">
                Prefer to see every click? Follow the <a href="https://hireco.help/setup" target="_blank" style="color:#8fb0ff;text-decoration:underline;">step-by-step walkthrough</a>. Stuck? Just reply to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:24px 44px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#5d6b96;">
              ${welcome ? `You're getting this because ${esc(email)} signed up for Hireco.` : `Someone asked to sign in to Hireco with ${esc(email)}.`} If that wasn't you, you can ignore this email.<br><br>
              <a href="https://hireco.help" style="color:#8a99c6;text-decoration:none;">hireco.help</a> &nbsp;&middot;&nbsp; Free &amp; open source
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${welcome ? `${first ? `${first}, your` : "Your"} network is ready to map.\n\nThanks for joining Hireco. Confirm your email and you're in:` : "Your one-time link to sign in to Hireco:"}
${link}

It works once and expires in an hour.

Then, in ten minutes:
1. Install the Chrome extension and sync your connections
2. Connect Hireco to your AI (Claude, Cursor, Codex and more)
3. Ask: "Who can get me hired as ... at ...?"

Step-by-step walkthrough: https://hireco.help/setup

If that wasn't you, you can ignore this email.
hireco.help`;

  return { subject, html, text };
}
