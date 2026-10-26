import Link from "next/link";

const prompts = [
  ["Get started with Hireco", "A guided tour of what Hireco can do, with an example network map."],
  ["Here's my CV. Who in my network can get me hired as a Head of Growth at a fintech?", "Full analysis: reads your CV, maps your network, builds your map and ranks the best paths."],
  ["Who can refer me into Monday.com?", "Insiders, ex-employees and recruiters at one company."],
  ["Which of my ex-coworkers are now hiring managers?", "Warm paths through people you've worked with."],
  ["Draft an intro message to Noa asking about the VP Growth role.", "Short, personal outreach based on your shared history."],
];

const tools = [
  ["get_started", "Onboarding and an example map"],
  ["get_sync_status", "How much of your network is synced"],
  ["get_my_profile", "Your own LinkedIn work history"],
  ["find_hiring_paths", "Sorts your network into hiring managers, decision makers, insiders, recruiters, introducers and ex-coworkers"],
  ["search_my_network", "Search by company, title, seniority or keyword"],
  ["find_people_at_company", "Live LinkedIn search: who in your network works or worked at a company"],
  ["get_person", "Full work history for one connection"],
  ["request_enrichment", "Fetch work history for specific people first"],
];

export default function Guide() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">← Dashboard</Link>
      <h1 className="mt-4 text-3xl font-semibold">Using Hireco with Claude</h1>
      <p className="mt-2 text-neutral-500">Hireco works inside your AI agent. Here&apos;s how to get the most out of it.</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Start here</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          In Claude Code, type <code>/</code> and pick <b>hireco · get-started</b> or <b>hireco · hiring-map</b>.
          In Claude Desktop, find them under the <b>+</b> button. Or just ask in plain words:
        </p>
        <ul className="mt-4 space-y-3">
          {prompts.map(([p, d]) => (
            <li key={p} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <p className="font-medium">“{p}”</p>
              <p className="mt-1 text-sm text-neutral-500">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-emerald-600/40 p-5">
        <h2 className="text-lg font-semibold">Claude skill: Hireco job hunt</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Teaches Claude the full job-hunt workflow: understand your target, map the network, rank warm paths and draft outreach.
        </p>
        <a href="/skills/hireco-job-hunt/SKILL.md" download className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Download SKILL.md
        </a>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
          <li><b>Claude Code:</b> save it as <code>~/.claude/skills/hireco-job-hunt/SKILL.md</code>.</li>
          <li><b>Claude.ai / Desktop:</b> Settings → Capabilities → Skills → upload it (zip the folder if asked).</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">What Claude can do with Hireco</h2>
        <dl className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
          {tools.map(([t, d]) => (
            <div key={t} className="flex gap-4 py-2 text-sm">
              <dt className="w-44 shrink-0 font-mono">{t}</dt>
              <dd className="text-neutral-600 dark:text-neutral-400">{d}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
