import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import CopyBlock from "@/components/CopyBlock";

const PROMPTS = [
  ["Get started with Hireco", "A short tour of what Hireco can do, with a sample result."],
  ["Here's my CV. Who in my network can get me hired as a Head of Growth at a fintech like Stripe or Revolut?", "The full analysis: your best paths in, a CSV and a visual map."],
  ["Who do I know at Monday.com, and who used to work there?", "Insiders and introducers at one company."],
  ["Which of my ex-coworkers are now managers?", "The warmest paths: people who've worked with you."],
  ["Enrich the top 30 prospects from that list.", "Premium: exact titles and full work history, from your 300-prospect allowance."],
];

const TOOLS = [
  ["find_hiring_paths", "The main tool. Sorts your network into hiring managers, decision makers, insiders, recruiters, introducers and ex-coworkers."],
  ["search_my_network", "Filter your connections by company, title, seniority or keyword."],
  ["enrich_prospects", "Premium. Exact titles and dated work history for people you choose (early-access allowance; everyone else enriches in their own AI with import_profiles)."],
  ["get_person", "Everything Hireco knows about one connection."],
  ["get_started", "The welcome tour."],
];

export default function Guide() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-24">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
        <Link href="/dashboard" className="text-sm text-mist hover:text-frost">Dashboard →</Link>
      </header>

      <p className="eyebrow rise d1 pt-8">Guide</p>
      <h1 className="rise d2 font-display mt-3 text-5xl font-light text-white">Getting the most from Hireco.</h1>
      <p className="rise d3 mt-4 max-w-2xl text-lg text-mist">
        Hireco lives inside your AI. Ask in plain language — every answer comes with your best paths in, a downloadable CSV and a visual map.
      </p>

      <section className="mt-14">
        <h2 className="font-display text-3xl font-light text-white">Prompts to start with</h2>
        <p className="mt-2 text-mist">In Claude Code, type <span className="code">/</span> and pick <b className="font-normal text-frost">hireco · get-started</b> or <b className="font-normal text-frost">hireco · find-paths</b>. Or just ask:</p>
        <div className="mt-6 grid gap-4">
          {PROMPTS.map(([p, d]) => (
            <div key={p}>
              <CopyBlock text={p} />
              <p className="mt-2 pl-1 text-sm text-mist">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-hi mt-14 p-8">
        <p className="eyebrow">Claude skill</p>
        <h2 className="font-display mt-2 text-3xl font-light text-white">Hireco job hunt</h2>
        <p className="mt-3 text-mist">
          Teaches Claude the whole flow: understand your target, map your network, pick who to enrich, rank warm paths and hand you the CSV and map.
        </p>
        <a href="/skills/hireco-job-hunt/SKILL.md" download className="btn-primary mt-6">↓ Download SKILL.md</a>
        <ul className="mt-6 space-y-2 text-sm text-frost">
          <li><b className="font-normal text-white">Claude Code:</b> save as <span className="code">~/.claude/skills/hireco-job-hunt/SKILL.md</span></li>
          <li><b className="font-normal text-white">Claude.ai / Desktop:</b> Settings → Capabilities → Skills → upload (zip the folder if asked)</li>
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl font-light text-white">What your AI can do</h2>
        <dl className="panel mt-6 divide-y divide-[var(--line)]">
          {TOOLS.map(([t, d]) => (
            <div key={t} className="grid gap-1 px-6 py-4 sm:grid-cols-[13rem_1fr]">
              <dt className="code text-ice">{t}</dt>
              <dd className="text-mist">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 grid gap-5 sm:grid-cols-2">
        <div className="panel p-7">
          <h3 className="font-display text-2xl text-white">Basic</h3>
          <p className="mt-2 text-mist">Titles and companies from headlines, plus live LinkedIn company searches run by your extension. Great for finding insiders, introducers and ex-coworkers.</p>
        </div>
        <div className="panel panel-hi p-7">
          <h3 className="font-display text-2xl text-white">Premium <span className="text-champagne">· 300 prospects</span></h3>
          <p className="mt-2 text-mist">Exact current titles and full dated work history for the people that matter. Your AI suggests a shortlist and asks before spending.</p>
        </div>
      </section>
    </main>
  );
}
