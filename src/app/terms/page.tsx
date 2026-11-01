import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage, Section } from "@/components/LegalPage";
import { REPO_URL } from "@/lib/exports";

export const metadata: Metadata = { title: "Terms of service — Hireco" };

export default function Terms() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of service" updated="1 November 2026">
      <p>These terms govern your use of Hireco — the website at hireco.help, the Hireco Chrome extension, the Hireco MCP server and related tools. Hireco is operated by Amir Baldiga (Israel). By creating an account or using Hireco you agree to these terms and the <Link href="/privacy">privacy policy</Link>.</p>

      <Section title="A free service">
        <p>Hireco is free and runs on free hosting plans. To keep it up for everyone there are daily usage limits, and when it&apos;s full new members wait in line for a spot. Features may change or be removed, and the service may be unavailable at times. There is no service-level commitment.</p>
        <p>The code is <a href={REPO_URL} target="_blank" rel="noreferrer">open source</a> under the MIT license. These terms cover the hosted service at hireco.help; if you run your own copy, you&apos;re responsible for it.</p>
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
        <p>Premium enrichment is optional and runs in your own AI, with a data tool (such as Zooq or Apify) that you connect to it under your own account; Hireco never receives your key for it. You approve each enrichment, and you&apos;re responsible for your use of that tool, its costs and your right to use the data it returns. Members from the early-access period keep their remaining allowance. Enriched data comes from public professional profiles and may be incomplete or out of date.</p>
      </Section>

      <Section title="No guarantees">
        <p>Hireco suggests people who may be able to help you. It doesn&apos;t guarantee introductions, interviews, or a job, and results depend on the data available. The service is provided &ldquo;as is&rdquo;, without warranties of any kind, and to the extent the law allows, Hireco isn&apos;t liable for indirect or consequential losses.</p>
      </Section>

      <Section title="Emails">
        <p>We send the emails your account needs (sign-in links, account notices). Product updates and tips are sent only if you opt in, and you can unsubscribe at any time.</p>
      </Section>

      <Section title="Ending use">
        <p>You can stop using Hireco at any time and ask us to delete your data (see the <Link href="/privacy">privacy policy</Link>). If you don&apos;t use Hireco for 45 days, your synced network is deleted; you can sync again later. We may suspend accounts that break these terms or abuse the free service.</p>
      </Section>

      <Section title="Law">
        <p>These terms are governed by the laws of Israel, and the courts of Tel Aviv have jurisdiction, except where the law of your country gives you rights that can&apos;t be waived.</p>
      </Section>

      <Section title="Contact">
        <p>Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </Section>
    </LegalPage>
  );
}
