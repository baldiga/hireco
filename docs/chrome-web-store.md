# Chrome Web Store submission — Hireco

Everything needed to fill in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Build files with `npm run zip-extension`; images with `node scripts/store-assets.mjs <captures>`.

## Package

- Upload: `dist/hireco-chrome-web-store.zip` (manifest at the zip root; host access: `linkedin.com`, `hireco.help` and the Hireco Supabase project).
- Bump `version` in `extension/manifest.json` for every new upload.

## Store listing

**Name:** Hireco

**Summary (max 132 chars):**
Find the people in your LinkedIn network who can get you hired — and hand the map to your AI agent.

**Category:** Workflow & Planning · **Language:** English

**Description:**

Your next role is one introduction away.

Hireco maps your LinkedIn network into the people who can actually get you hired — hiring managers, decision makers, insiders at your target companies, recruiters, introducers who used to work there, and ex-coworkers who've seen your work.

HOW IT WORKS
1. Install the extension and create your free Hireco account.
2. Press Sync. Hireco reads your 1st-degree connections from your own logged-in LinkedIn — no passwords leave your browser.
3. Connect Hireco to your AI agent (Claude, Codex, Cursor) with your personal key.
4. Ask: "Who in my network can get me hired as Head of Growth at Stripe?" — and get your best paths in, ranked, with a radar map and a CSV.

WHAT YOU GET
• A ranked "who to talk to" list — best paths first, with who to contact first at each company
• An interactive radar map of every route in
• Live company searches: who in your network works, or used to work, at any company
• Your maps kept for 14 days, one click away in the extension

PRIVATE BY DESIGN
The extension works inside your own LinkedIn session and only talks to linkedin.com and Hireco's own servers. Hireco never sees your LinkedIn password or cookies, and never messages anyone for you.

Hireco is free and open source (MIT): https://github.com/baldiga/hireco. Create your account at https://hireco.help

**Images:** `dist/store/1-hero.png`, `2-radar.png`, `3-list.png`, `4-extension.png` (1280×800) · small promo tile `dist/store/promo-440x280.png` · icon is in the package (`icons/icon-128.png`).

**Website:** https://hireco.help · **Support:** https://hireco.help/support

## Privacy practices tab

**Single purpose:**
Hireco syncs the user's own LinkedIn connections to their Hireco account so their AI agent can find which connections can help them get hired.

**Permission justifications:**
- `storage` — saves the user's Hireco API key and sync progress locally.
- `alarms` — runs the daily background sync and checks for company searches the user's AI agent requested.
- `scripting` — runs LinkedIn requests inside a linkedin.com tab, so they use the user's own logged-in session.
- `tabs` — finds an open linkedin.com tab, or opens a background one for syncing; opens Hireco maps and the dashboard from the popup.
- Host `https://www.linkedin.com/*` — reads the user's own connections and runs the searches they ask for.
- Host `https://hireco.help/*` — sends synced data to the user's Hireco account.
- Host `https://frkrubdwndewjeoimnhi.supabase.co/*` — Hireco's own backend: checks for company searches the user's AI agent requested (authenticated with the user's Hireco key).

**Remote code:** No, I am not using remote code. (All JavaScript is in the package.)

**Data usage — collected:**
- Personally identifiable information (name and email of the account holder)
- Website content (the user's LinkedIn connections list: names, headlines, profile links, connection dates; results of searches the user requests)
- Authentication information (the user's Hireco API key, stored locally in the extension)

**Certify:**
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://hireco.help/privacy

## Distribution

**Public**: Hireco is open to everyone. (Unlisted is fine for a first review if you prefer.)

## Review risks to expect

- The extension automates reading LinkedIn. Reviewers may ask for clarification or reject under policies on scraping or third-party site terms. Keep the single-purpose and "user-initiated, user's own data" framing, and reply to any review question with the permission justifications above.
- Reviews usually take a few days; first submissions and broad host permissions take longer.
