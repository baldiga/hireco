import Link from "next/link";

const steps = [
  ["Install the extension", "It reads your LinkedIn connections from your own logged-in browser. No passwords leave your machine."],
  ["Connect your AI", "Add Hireco to Claude, Codex or Cursor as an MCP server with your personal key."],
  ["Ask", "“Here's my CV. Who in my network can get me hired as Head of Growth at a fintech?”"],
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">Hireco</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
        Your next job is already in your network.
      </h1>
      <p className="mt-5 text-lg text-neutral-500">
        Hireco maps your LinkedIn connections into hiring managers, decision makers, insiders, recruiters,
        introducers and ex-coworkers — and plugs that map straight into your AI agent.
      </p>
      <Link href="/dashboard" className="mt-8 inline-block rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white hover:bg-emerald-700">
        Get started
      </Link>
      <ol className="mt-16 grid gap-6 sm:grid-cols-3">
        {steps.map(([title, body], i) => (
          <li key={title} className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
            <span className="text-sm text-neutral-400">0{i + 1}</span>
            <h2 className="mt-1 font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-neutral-500">{body}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
