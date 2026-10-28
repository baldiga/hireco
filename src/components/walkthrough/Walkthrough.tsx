"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import SHOTS from "@/lib/walkthroughShots.json";
import { ChatMock } from "../Mocks";
import { FolderPickerArt, PasteArt, PinArt, UnzipArt } from "./Illustrations";

// zoom: [scale, transform-origin] magnifies the screenshot (and its rings) around a small target.
type Shot = { shot: keyof typeof SHOTS; marks?: number[]; url?: string; urlMark?: boolean; narrow?: boolean; zoom?: [number, string] };
type Step = { phase: number; title: string; body: ReactNode; tip?: ReactNode; visual: Shot | ReactNode };

const PHASES = ["Install the extension", "Get your key", "Connect the extension", "Connect your AI"];

const B = ({ children }: { children: ReactNode }) => <b className="font-normal text-white">{children}</b>;
const C = ({ children }: { children: ReactNode }) => <span className="code rounded bg-black/30 px-1.5 py-0.5 text-ice">{children}</span>;

const STEPS: Step[] = [
  {
    phase: 0, title: "Download the extension",
    body: <>On hireco.help (or your dashboard) click <B>Download the extension</B>. You get <C>hireco-extension.zip</C> in your Downloads folder.</>,
    visual: { shot: "download", marks: [0], url: "hireco.help" },
  },
  {
    phase: 0, title: "Unzip it",
    body: <>Windows: right-click the zip → <B>Extract All…</B> → <B>Extract</B>. Mac: double-click it. You get a <C>hireco-extension</C> folder.</>,
    tip: <>Move that folder somewhere it can stay, like Documents. Chrome runs the extension from there, so don&apos;t delete it.</>,
    visual: <UnzipArt />,
  },
  {
    phase: 0, title: "Open Chrome's extensions page",
    body: <>Open a new tab, type <C>chrome://extensions</C> in the address bar and press <B>Enter</B>.</>,
    tip: <>Or: Chrome menu (⋮) → <B>Extensions</B> → <B>Manage Extensions</B>.</>,
    visual: { shot: "ext-devmode", url: "chrome://extensions", urlMark: true },
  },
  {
    phase: 0, title: "Turn on Developer mode",
    body: <>Click the <B>Developer mode</B> switch in the <B>top-right corner</B>. This lets Chrome install extensions that aren&apos;t in the Web Store yet.</>,
    visual: { shot: "ext-devmode", marks: [0], url: "chrome://extensions", zoom: [1.7, "97% 0%"] },
  },
  {
    phase: 0, title: "Click “Load unpacked”",
    body: <>A new row of buttons appears on the <B>top left</B>. Click <B>Load unpacked</B>.</>,
    visual: { shot: "ext-load", marks: [0], url: "chrome://extensions", zoom: [1.6, "0% 10%"] },
  },
  {
    phase: 0, title: "Choose the hireco-extension folder",
    body: <>Pick the <C>hireco-extension</C> folder (the one with <C>manifest.json</C> inside) and click <B>Select Folder</B>.</>,
    tip: <>Seeing “Manifest file is missing”? Windows sometimes puts the folder inside another folder with the same name. Go one level deeper and pick the inner one.</>,
    visual: <FolderPickerArt />,
  },
  {
    phase: 0, title: "Hireco is installed",
    body: <>Hireco now appears in your extensions. Make sure its switch is <B>on</B>.</>,
    tip: <>Chrome may sometimes warn about developer-mode extensions. That&apos;s normal for anything installed this way; keep Hireco on.</>,
    visual: { shot: "ext-installed", marks: [0], url: "chrome://extensions" },
  },
  {
    phase: 0, title: "Pin it to your toolbar",
    body: <>Click the <B>puzzle-piece</B> icon to the right of the address bar, then the <B>pin</B> next to Hireco. Now it&apos;s one click away.</>,
    visual: <PinArt />,
  },
  {
    phase: 1, title: "Sign in to Hireco",
    body: <>Go to <C>hireco.help/login</C>, enter the email you were approved with and click <B>Email me a sign-in link</B>. Open the link from your inbox.</>,
    tip: <>No email after a minute? Check spam. The link works once and expires in an hour.</>,
    visual: { shot: "login", marks: [0, 1], url: "hireco.help/login" },
  },
  {
    phase: 1, title: "Generate your API key",
    body: <>On your dashboard, find <B>Get your API key</B> and click <B>Generate API key</B>.</>,
    visual: { shot: "key-generate", marks: [0], url: "hireco.help/dashboard" },
  },
  {
    phase: 1, title: "Copy the key",
    body: <>Click <B>Copy</B>. The key starts with <C>hk_</C>.</>,
    tip: <>It&apos;s shown only once. Lost it? Just generate a new one; the old one stops working.</>,
    visual: { shot: "key-copy", marks: [1], url: "hireco.help/dashboard" },
  },
  {
    phase: 2, title: "Paste the key into the extension",
    body: <>Click the <B>Hireco icon</B> in your toolbar. Paste the key and click <B>Connect</B>.</>,
    visual: { shot: "popup-key", marks: [0, 1], narrow: true },
  },
  {
    phase: 2, title: "Sync your connections",
    body: <>Make sure you&apos;re <B>logged in to LinkedIn</B> in this Chrome, then click <B>Sync now</B>. A few thousand connections take a couple of minutes; you can keep browsing.</>,
    visual: { shot: "popup-sync", marks: [0], narrow: true },
  },
  {
    phase: 3, title: "Pick your AI and copy the setup",
    body: <>Back on the dashboard, under <B>Connect your AI</B>, choose your AI from the list (Claude Code, Claude Desktop, Cursor, Codex, VS Code…) and click <B>Copy</B>. Your key is already filled in.</>,
    visual: { shot: "connect", marks: [0, 1], url: "hireco.help/dashboard" },
  },
  {
    phase: 3, title: "Paste it into your AI",
    body: <>Follow the steps shown for your AI. In Claude Code: paste the two lines, then your key when it asks.</>,
    tip: <>Claude Desktop, Cursor, Codex and VS Code each get their own steps on the dashboard: exactly which setting to open and where to paste.</>,
    visual: <PasteArt />,
  },
  {
    phase: 3, title: "Ask your first question",
    body: <>Try: <i className="text-ice">“Here&apos;s my CV. Who in my network can get me hired as … at …?”</i> You get your best paths in, a CSV and a visual map.</>,
    visual: <ChatMock />,
  },
];

const isShot = (v: Step["visual"]): v is Shot => !!v && typeof v === "object" && "shot" in v;

function ShotView({ v }: { v: Shot }) {
  const meta = SHOTS[v.shot];
  const img = (
    <div className="relative" style={v.zoom ? { transform: `scale(${v.zoom[0]})`, transformOrigin: v.zoom[1] } : undefined}>
      <Image src={`/walkthrough/${v.shot}.webp`} alt="" width={meta.w * 2} height={meta.h * 2} className="block h-auto w-full" priority />
      {(v.marks ?? []).map((i) => {
        const m = meta.marks[i];
        return (
          <span
            key={i}
            className="wt-ring pointer-events-none absolute rounded-lg"
            style={{ left: `calc(${m.x}% - 4px)`, top: `calc(${m.y}% - 4px)`, width: `calc(${m.w}% + 8px)`, height: `calc(${m.h}% + 8px)` }}
          />
        );
      })}
    </div>
  );
  if (v.narrow) return <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)]">{img}</div>;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#202124] shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)]">
      {v.url && (
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className={`code ml-2 flex-1 truncate rounded-full bg-[#35363a] px-4 py-1 text-[0.7rem] text-[#e8eaed] ${v.urlMark ? "wt-ring" : ""}`}>{v.url}</span>
        </div>
      )}
      <div className="overflow-hidden">{img}</div>
    </div>
  );
}

export default function Walkthrough() {
  const [i, setI] = useState(0);
  const go = useCallback((n: number) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, n));
    setI(next);
    history.replaceState(null, "", `#step-${next + 1}`);
  }, []);

  // Deep links (#step-N) can only be read after mount.
  useEffect(() => {
    const fromHash = () => {
      const n = Number(location.hash.match(/^#step-(\d+)$/)?.[1]);
      if (n >= 1 && n <= STEPS.length) setI(n - 1);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go]);

  const step = STEPS[i];
  const firstOf = (p: number) => STEPS.findIndex((s) => s.phase === p);

  return (
    <div>
      {/* Phases */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PHASES.map((p, n) => {
          const steps = STEPS.filter((s) => s.phase === n).length;
          const done = STEPS.slice(0, i).filter((s) => s.phase === n).length;
          const active = step.phase === n;
          return (
            <button key={p} onClick={() => go(firstOf(n))} className={`rounded-2xl border px-4 py-3 text-left transition ${active ? "border-azure/60 bg-azure/10" : "border-[var(--line)] hover:bg-white/[0.03]"}`}>
              <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-mist">Part {n + 1}</span>
              <span className={`mt-0.5 block text-sm ${active ? "text-white" : "text-frost"}`}>{p}</span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-glint transition-all" style={{ width: `${(done / steps) * 100}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Step */}
      <div className="panel mt-6 grid items-center gap-8 p-5 sm:p-8 lg:grid-cols-[1.7fr_1fr]">
        <div key={i} className="wt-in min-w-0">{isShot(step.visual) ? <ShotView v={step.visual} /> : step.visual}</div>
        <div className="min-w-0">
          <p className="eyebrow">Step {i + 1} of {STEPS.length}</p>
          <h2 className="font-display mt-2 text-3xl font-light text-white sm:text-4xl">{step.title}</h2>
          <p className="mt-4 leading-relaxed text-frost">{step.body}</p>
          {step.tip && <p className="mt-4 rounded-2xl border border-champagne/25 bg-champagne/[0.06] p-4 text-sm leading-relaxed text-frost">{step.tip}</p>}
          <div className="mt-7 flex items-center gap-3">
            <button onClick={() => go(i - 1)} disabled={i === 0} className="btn-ghost disabled:opacity-40">← Back</button>
            {i < STEPS.length - 1 ? (
              <button onClick={() => go(i + 1)} className="btn-primary">Next →</button>
            ) : (
              <a href="/dashboard" className="btn-primary">Go to my dashboard →</a>
            )}
          </div>
          <p className="mt-4 hidden text-xs text-mist sm:block">Tip: use the ← → keys.</p>
        </div>
      </div>

      {/* All steps */}
      <ol className="mt-6 flex flex-wrap gap-1.5">
        {STEPS.map((s, n) => (
          <li key={s.title}>
            <button
              onClick={() => go(n)}
              title={s.title}
              aria-label={`Step ${n + 1}: ${s.title}`}
              className={`grid h-8 w-8 place-items-center rounded-full border text-xs transition ${n === i ? "border-glint bg-glint/15 text-glint" : n < i ? "border-glint/30 text-glint/70" : "border-[var(--line)] text-mist hover:text-frost"}`}
            >
              {n + 1}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
