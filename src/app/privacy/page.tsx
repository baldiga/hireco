import type { Metadata } from "next";
import { CONTACT_EMAIL, LegalPage, Section } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy policy — Hireco" };

export default function Privacy() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy policy" updated="27 October 2026">
      <p>
        Hireco helps you find the people in your own LinkedIn network who can help you get hired. This policy explains what
        data Hireco handles, why, and the choices you have. Hireco is in early access; if anything here is unclear, email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <Section title="What we collect">
        <ul className="space-y-2">
          <li><b className="font-normal text-white">Account details</b> — your name, email address and LinkedIn profile URL when you request access, and your email when you sign in.</li>
          <li><b className="font-normal text-white">Your LinkedIn network</b> — when you press Sync in the Hireco Chrome extension, it reads your own 1st-degree connections from your logged-in LinkedIn session: names, headlines, public profile identifiers, profile picture links and the date you connected. It also reads your own profile&apos;s work history and education.</li>
          <li><b className="font-normal text-white">Company searches</b> — when your AI agent asks who in your network works or worked at a company, the extension runs that search on LinkedIn in your browser and sends us the matching connections&apos; profile identifiers.</li>
          <li><b className="font-normal text-white">Premium enrichment</b> — if you choose to enrich specific prospects, we fetch their public professional profile (titles, work history, education, location) through a third-party data provider.</li>
          <li><b className="font-normal text-white">Results you create</b> — maps and CSV exports generated from your searches.</li>
          <li><b className="font-normal text-white">API keys</b> — we store only a one-way hash of each key, never the key itself.</li>
        </ul>
      </Section>

      <Section title="What we don't collect">
        <ul className="space-y-2">
          <li>Your LinkedIn password or session cookies. The extension works inside your own browser session and never sends your LinkedIn credentials to Hireco.</li>
          <li>Your messages, posts, or anything outside your connections list, your own profile and the searches you ask for.</li>
          <li>Browsing history. The extension only acts on linkedin.com and hireco.help.</li>
        </ul>
      </Section>

      <Section title="How we use it">
        <p>Only to provide Hireco to you: to sync and store your network, answer your AI agent&apos;s requests over the Hireco MCP server, build your maps and CSV files, send sign-in emails, and keep the service secure. We do not sell your data, use it for advertising, or share your network with other Hireco users.</p>
        <p>Enriched public profiles may be cached and reused to answer requests for other members who are connected to the same person, so we don&apos;t fetch the same profile twice. Cached profiles are refreshed or discarded after 90 days.</p>
      </Section>

      <Section title="Who processes data for us">
        <ul className="space-y-2">
          <li><b className="font-normal text-white">Supabase</b> — database and authentication (hosted in the EU, Frankfurt).</li>
          <li><b className="font-normal text-white">Vercel</b> — web hosting and the API.</li>
          <li><b className="font-normal text-white">Resend</b> — sending sign-in emails.</li>
          <li><b className="font-normal text-white">Apify</b> — fetching public profiles, only when you use premium enrichment.</li>
        </ul>
        <p>Your AI agent (for example Claude) receives the results you ask it for, under that provider&apos;s own terms.</p>
      </Section>

      <Section title="How long we keep it">
        <ul className="space-y-2">
          <li>Maps and CSV exports are deleted automatically after 14 days.</li>
          <li>Your synced network stays in your account until you delete it or close your account.</li>
          <li>Cached public profiles are refreshed or deleted after 90 days.</li>
        </ul>
      </Section>

      <Section title="Your choices">
        <p>You can stop syncing at any time by removing the extension, and revoke API keys from your dashboard. To get a copy of your data, or to delete your account and everything synced to it, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address you signed up with. We act on requests within 30 days.</p>
      </Section>

      <Section title="Security">
        <p>Data is encrypted in transit, access is limited by per-user keys and row-level security, and API keys are stored only as hashes. No system is perfectly secure; tell us at once if you think your key was exposed and we&apos;ll revoke it.</p>
      </Section>

      <Section title="Changes">
        <p>We&apos;ll update this page when our practices change and note the date at the top. For material changes we&apos;ll email you.</p>
      </Section>
    </LegalPage>
  );
}
