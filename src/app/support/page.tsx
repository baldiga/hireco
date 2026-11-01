import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage, Section } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Support — Hireco" };

const FAQ = [
  ["The extension says my API key isn't valid", "Generate a new key on your dashboard and paste it into the extension. Keys are shown only once."],
  ["Sync stops or shows “Not signed in to LinkedIn”", "Make sure you're signed in to linkedin.com in the same Chrome profile, then press Sync again."],
  ["Claude says a search is still running", "Company searches run in your browser through the extension. Keep Chrome open, wait a minute, and ask again."],
  ["My map link says it has expired", "Maps are kept for 14 days. Ask your AI the same question again for a fresh map."],
  ["I'm not getting the sign-in email", "Check spam, and make sure your access has been approved. Links expire after an hour."],
];

export default function Support() {
  return (
    <LegalPage eyebrow="Help" title="Support">
      <p>
        Hireco is free and open source, and we read every message. Email <a className="text-ice underline decoration-white/20 underline-offset-4" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and
        we&apos;ll get back to you. For setup steps and prompts, see the <Link className="text-ice underline decoration-white/20 underline-offset-4" href="/guide">guide</Link>.
      </p>
      <Section title="Common questions">
        <dl className="panel divide-y divide-[var(--line)]">
          {FAQ.map(([q, a]) => (
            <div key={q} className="px-6 py-4">
              <dt className="text-white">{q}</dt>
              <dd className="mt-1 text-mist">{a}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </LegalPage>
  );
}
