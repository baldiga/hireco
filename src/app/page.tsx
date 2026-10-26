import Link from "next/link";
import { EarlyBadge, Wordmark } from "@/components/Brand";
import Constellation from "@/components/Constellation";
import { ChatMock, ChromeMock, PopupMock, TerminalMock } from "@/components/Mocks";
import Radar from "@/components/radar/Radar";
import WaitlistForm from "@/components/WaitlistForm";
import { DEMO_MAP } from "@/lib/demoMap";

const PATHS = [
  ["Hiring managers", "People who lead the team you want to join — the ones who actually say yes."],
  ["Decision makers", "VPs and execs in your function who can open a role or fast-track you."],
  ["Insiders", "Anyone at your target companies who can refer you internally."],
  ["Introducers", "People who used to work there and still know who's who."],
  ["Recruiters", "Talent partners hiring at the companies you care about."],
  ["Ex-coworkers", "People who've seen your work — the warmest referral there is."],
];

const STEPS = [
  { n: "01", title: "Install the extension", body: "Download, unzip, then in Chrome open chrome://extensions → turn on Developer mode → Load unpacked → pick the folder.", mock: <ChromeMock /> },
  { n: "02", title: "Sync your network", body: "Paste your Hireco key into the extension and press Sync. It reads your connections from your own logged-in LinkedIn — no passwords leave your browser.", mock: <PopupMock /> },
  { n: "03", title: "Connect your AI", body: "Add Hireco to Claude Code, Codex or Cursor with one command. It's a standard MCP server.", mock: <TerminalMock /> },
  { n: "04", title: "Ask", body: "Tell your AI the role and companies you want. Get your best paths in, a CSV and a visual map.", mock: <ChatMock /> },
];

const USPS = [
  ["AI-native", "No new app to learn. Hireco lives inside the AI agent you already use, and answers in plain language."],
  ["Private by design", "The extension works with your own LinkedIn session, in your own browser. We never see your password."],
  ["Paths, not lists", "Not 1,000 names — the five people most likely to get you hired, and why each one matters."],
  ["Ready to act", "Every answer comes with a CSV and a visual map, so you can start reaching out the same afternoon."],
];

export default function Home() {
  return (
    <main className="relative overflow-x-clip">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <nav className="flex items-center gap-6 text-sm text-mist">
          <a href="#how" className="hidden hover:text-frost sm:inline">How it works</a>
          <a href="#example" className="hidden hover:text-frost sm:inline">Example</a>
          <a href="#early" className="hidden hover:text-frost sm:inline">Early access</a>
          <Link href="/login" className="hover:text-frost">Sign in</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-20 pt-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div>
          <div className="rise d1"><EarlyBadge /></div>
          <h1 className="rise d2 font-display mt-7 text-[3.2rem] font-light leading-[1.02] tracking-tight text-white sm:text-[4.6rem]">
            Your next role is <em className="text-gradient font-light">one introduction</em> away.
          </h1>
          <p className="rise d3 mt-6 max-w-xl text-lg leading-relaxed text-mist">
            Hireco turns your LinkedIn network into a hiring map — the managers, insiders and ex-coworkers who can get you in —
            and hands it straight to your AI agent.
          </p>
          <div className="rise d4 mt-9 flex flex-wrap gap-3">
            <a href="#early" className="btn-primary">Request early access</a>
            <a href="/downloads/hireco-extension.zip" download className="btn-ghost">↓ Download the extension</a>
          </div>
          <p className="rise d5 mt-5 text-xs text-mist/80">Chrome extension + MCP server · works with Claude, Codex and Cursor</p>
        </div>
        <div className="rise d3 relative">
          <div className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(47,91,234,.35),transparent)] blur-2xl" />
          <div className="panel panel-hi p-4 sm:p-6"><Constellation /></div>
        </div>
      </section>

      {/* Positioning */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="hairline" />
        <div className="grid gap-10 py-16 lg:grid-cols-[1fr_1.4fr]">
          <p className="eyebrow">The problem</p>
          <div>
            <p className="font-display text-4xl font-light leading-tight text-white sm:text-5xl">
              Applications go to a pile. <span className="italic text-ice">Referrals go to a person.</span>
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
              The people who can get you hired are usually already in your network — you just can&apos;t see them.
              A former teammate now at your dream company. Someone who left it last year and still knows the hiring manager.
              Hireco finds them in minutes.
            </p>
          </div>
        </div>
        <div className="hairline" />
      </section>

      {/* Six paths */}
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="eyebrow">What Hireco finds</p>
        <h2 className="font-display mt-4 text-4xl font-light text-white sm:text-5xl">Six kinds of people who get you hired.</h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {PATHS.map(([title, body], i) => (
            <div key={title} className="group bg-ink-2/90 p-8 transition-colors hover:bg-navy/60">
              <span className="code text-glint/80">0{i + 1}</span>
              <h3 className="font-display mt-3 text-2xl font-normal text-white">{title}</h3>
              <p className="mt-2 leading-relaxed text-mist">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-10 px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="font-display mt-4 text-4xl font-light text-white sm:text-5xl">Ten minutes to your first map.</h2>
          </div>
          <a href="/downloads/hireco-extension.zip" download className="btn-primary">↓ Download the extension</a>
        </div>
        <div className="mt-16 space-y-20">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <span className="font-display text-6xl font-light text-ice/30">{s.n}</span>
                <h3 className="font-display mt-2 text-3xl font-normal text-white">{s.title}</h3>
                <p className="mt-3 max-w-md text-lg leading-relaxed text-mist">{s.body}</p>
              </div>
              <div className="relative">
                <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(closest-side,rgba(47,91,234,.22),transparent)]" />
                {s.mock}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real example */}
      <section id="example" className="mx-auto w-full max-w-6xl scroll-mt-10 px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">A real example · names changed</p>
            <h2 className="font-display mt-4 text-4xl font-light text-white sm:text-5xl">What you get back.</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mist">
              One early adopter asked for a GTM engineer or RevOps role. Hireco searched 8,053 connections and returned this map:
              eight places to start, in order, and who to talk to first at each. Hover or tap anything.
            </p>
          </div>
        </div>
        <div className="mt-10"><Radar spec={DEMO_MAP} /></div>
      </section>

      {/* USPs */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {USPS.map(([title, body]) => (
            <div key={title} className="panel p-8">
              <h3 className="font-display text-2xl font-normal text-white">{title}</h3>
              <p className="mt-2 leading-relaxed text-mist">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Early access */}
      <section id="early" className="mx-auto w-full max-w-6xl scroll-mt-10 px-6 py-24">
        <div className="panel panel-hi grid gap-12 overflow-hidden p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(127,227,255,.18),transparent)]" />
          <div>
            <EarlyBadge />
            <h2 className="font-display mt-6 text-4xl font-light leading-tight text-white sm:text-5xl">
              Built for early adopters.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-mist">
              Hireco is new, and a little technical — you&apos;ll load a Chrome extension and add an MCP server to your AI.
              In return you get it free while we&apos;re in early access, including premium enrichment of up to 300 prospects
              with exact titles and full work history.
            </p>
            <ul className="mt-6 space-y-2 text-frost">
              {["Free for a limited time", "300 premium prospects included", "Direct line to the team — your feedback shapes the product"].map((t) => (
                <li key={t} className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-glint" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <WaitlistForm />
            <p className="mt-6 text-center text-sm text-mist">
              Already approved? <Link href="/login" className="text-ice underline decoration-white/20 underline-offset-4">Sign in</Link>
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-xs text-mist">
        <Wordmark />
        <p>Hireco reads only what you can already see on LinkedIn, from your own browser.</p>
      </footer>
    </main>
  );
}
