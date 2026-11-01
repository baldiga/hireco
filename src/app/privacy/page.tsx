import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage, Section } from "@/components/LegalPage";
import { REPO_URL } from "@/lib/exports";

export const metadata: Metadata = { title: "Privacy policy — Hireco" };

export default function Privacy() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy policy" updated="1 November 2026">
      <p>
        Hireco helps you find the people in your own LinkedIn network who can help you get hired. It&apos;s a free, open-source project
        operated by Amir Baldiga (Israel), who is responsible for the data described here. This policy explains what data Hireco handles,
        why, and the choices you have. If anything is unclear, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <Section title="What we collect">
        <ul className="space-y-2">
          <li><b className="font-normal text-white">Account details</b>: your name, email address and (if you add it) LinkedIn profile URL when you sign up, plus the date you accepted these terms and your email preferences.</li>
          <li><b className="font-normal text-white">Your LinkedIn network</b>: when you press Sync in the Hireco Chrome extension, it reads your own 1st-degree connections from your logged-in LinkedIn session: names, headlines, public profile identifiers, profile picture links and the date you connected. It also reads your own profile&apos;s work history and education.</li>
          <li><b className="font-normal text-white">Company searches</b>: when your AI agent asks who in your network works or worked at a company, the extension runs that search on LinkedIn in your browser and sends us the matching connections&apos; profile identifiers.</li>
          <li><b className="font-normal text-white">Premium enrichment</b>: if you choose to enrich specific prospects, your own AI fetches their public professional profile (titles, work history, education, location) with a data tool you connected to it, and saves the result to your Hireco account. Your key for that tool stays in your AI app; Hireco never receives or stores it. Early-access members may also use an allowance that Hireco fetches through Apify.</li>
          <li><b className="font-normal text-white">Results you create</b>: maps and CSV exports generated from your searches.</li>
          <li><b className="font-normal text-white">API keys</b>: we store only a one-way hash of each Hireco key, never the key itself.</li>
          <li><b className="font-normal text-white">Usage counts</b>: how many requests each account makes per day, to apply the free-tier limits.</li>
          <li><b className="font-normal text-white">Website usage</b>: only if you accept analytics cookies, Google Analytics counts visits and the pages people use (pages viewed, referrer, device and approximate location). It never runs on map pages, and the extension doesn&apos;t use it.</li>
        </ul>
      </Section>

      <Section title="What we don't collect">
        <ul className="space-y-2">
          <li>Your LinkedIn password or session cookies. The extension works inside your own browser session and never sends your LinkedIn credentials to Hireco.</li>
          <li>Your messages, posts, or anything outside your connections list, your own profile and the searches you ask for.</li>
          <li>Browsing history. The extension only acts on linkedin.com and Hireco&apos;s own servers.</li>
        </ul>
      </Section>

      <Section title="How we use it">
        <p>To provide Hireco to you: to sync and store your network, answer your AI agent&apos;s requests over the Hireco MCP server, build your maps and CSV files, send sign-in and account emails, apply usage limits, and keep the service secure. We do not sell your data, use it for advertising, or share your network with other Hireco members.</p>
        <p>Enriched public profiles fetched by Hireco may be cached and reused for other members connected to the same person, so the same profile isn&apos;t fetched (or paid for) twice. Cached profiles are refreshed or discarded after 90 days. Profiles your own AI imports are used only in your account.</p>
      </Section>

      <Section title="Emails">
        <p>We send the emails needed to run your account: sign-in links, a note when a spot opens up for you, and important changes to these terms. Product updates and tips are sent only if you opt in, and every one of them has an unsubscribe link. You can also change this on your dashboard at any time.</p>
      </Section>

      <Section title="Who processes data for us">
        <ul className="space-y-2">
          <li><b className="font-normal text-white">Supabase</b>: database and authentication (hosted in the EU, Frankfurt).</li>
          <li><b className="font-normal text-white">Vercel</b>: web hosting and the API.</li>
          <li><b className="font-normal text-white">Resend</b>: sending emails.</li>
          <li><b className="font-normal text-white">Apify</b>: fetching public profiles for the early-access enrichment allowance. Tools you connect to your own AI (for example Zooq or Apify) work under your own account with them, not ours.</li>
          <li><b className="font-normal text-white">Google Analytics</b>: website visit statistics, only after you accept analytics cookies.</li>
        </ul>
        <p>Your AI agent (for example Claude) receives the results you ask it for, under that provider&apos;s own terms. Some of these services store data outside your country, including in the United States, under their standard data-protection terms.</p>
      </Section>

      <Section title="How long we keep it">
        <ul className="space-y-2">
          <li>Maps and CSV exports are deleted automatically after 14 days.</li>
          <li>If you don&apos;t use Hireco for 45 days, your synced network is deleted to keep the free service running. Your account stays, and you can sync again at any time.</li>
          <li>Cached public profiles are refreshed or deleted after 90 days.</li>
          <li>Usage counts are deleted after 2 days.</li>
        </ul>
      </Section>

      <Section title="Cookies">
        <p>Hireco uses a sign-in cookie that&apos;s needed for the site to work. Analytics cookies are optional and set only if you click Accept on the cookie notice; you can change your mind by clearing this site&apos;s cookies.</p>
      </Section>

      <Section title="Your rights">
        <p>You can stop syncing at any time by removing the extension, revoke API keys from your dashboard, and turn product emails on or off. You can ask to see, correct, export or delete your data, or object to how it&apos;s used: email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address you signed up with, and we&apos;ll act within 30 days. You can also complain to your local data-protection authority (in Israel, the Privacy Protection Authority).</p>
      </Section>

      <Section title="Security">
        <p>Data is encrypted in transit, access is limited by per-user keys and row-level security, Hireco keys are stored only as hashes, and we never ask for your keys to other services. No system is perfectly secure; tell us at once if you think a key was exposed. Hireco&apos;s code is <a href={REPO_URL} target="_blank" rel="noreferrer">open source</a>, so anyone can check how this works.</p>
      </Section>

      <Section title="Changes">
        <p>We&apos;ll update this page when our practices change and note the date at the top. For material changes we&apos;ll email you.</p>
      </Section>
    </LegalPage>
  );
}
