import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage, Section } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of service — Hireco" };

export default function Terms() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of service" updated="27 October 2026">
      <p>These terms govern your use of Hireco — the website at hireco.help, the Hireco Chrome extension, the Hireco MCP server and related tools. By using Hireco you agree to them.</p>

      <Section title="Early access">
        <p>Hireco is in early access. It&apos;s free for a limited time, features may change or be removed, and the service may be unavailable at times. Access is granted by invitation and can be withdrawn.</p>
      </Section>

      <Section title="Your account and keys">
        <p>Keep your API keys secret — anyone with your key can read your Hireco data. You&apos;re responsible for activity under your account. Revoke a key you think was exposed.</p>
      </Section>

      <Section title="Your LinkedIn account">
        <p>The Hireco extension reads data you can already see on LinkedIn, from your own logged-in browser, when you ask it to. You decide whether to use it. LinkedIn&apos;s own terms apply to your LinkedIn account, and LinkedIn may restrict accounts it believes are automated; you use the extension at your own risk. Hireco paces its requests but can&apos;t guarantee LinkedIn&apos;s response.</p>
      </Section>

      <Section title="Acceptable use">
        <ul className="space-y-2">
          <li>Use Hireco to find and reach out to people in your own network about your own career.</li>
          <li>Don&apos;t use it to spam, harass, or bulk-message people, to build or resell contact databases, or to break any law or anyone else&apos;s terms.</li>
          <li>Don&apos;t try to access other members&apos; data, or to disrupt or reverse-engineer the service.</li>
        </ul>
      </Section>

      <Section title="Premium enrichment">
        <p>Premium enrichment is limited to an allowance of prospects per member (currently 300 during early access). Enriched data comes from public professional profiles and may be incomplete or out of date.</p>
      </Section>

      <Section title="No guarantees">
        <p>Hireco suggests people who may be able to help you. It doesn&apos;t guarantee introductions, interviews, or a job, and results depend on the data available. The service is provided &ldquo;as is&rdquo;, without warranties of any kind, and to the extent the law allows, Hireco isn&apos;t liable for indirect or consequential losses.</p>
      </Section>

      <Section title="Ending use">
        <p>You can stop using Hireco at any time and ask us to delete your data (see the <Link href="/privacy">privacy policy</Link>). We may suspend accounts that break these terms.</p>
      </Section>

      <Section title="Contact">
        <p>Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </Section>
    </LegalPage>
  );
}
