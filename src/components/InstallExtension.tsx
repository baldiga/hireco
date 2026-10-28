// Step-by-step "Load unpacked" install, numbered to match the markers in ChromeMock.
import type { ReactNode } from "react";

const B = ({ children }: { children: ReactNode }) => <b className="font-normal text-white">{children}</b>;
const C = ({ children }: { children: ReactNode }) => <span className="code rounded bg-black/30 px-1.5 py-0.5 text-ice">{children}</span>;

const STEPS: ReactNode[] = [
  <><B>Download</B> <C>hireco-extension.zip</C>.</>,
  <><B>Unzip it.</B> Windows: right-click the file → <B>Extract All</B> → <B>Extract</B>. Mac: double-click it. Keep the <C>hireco-extension</C> folder somewhere it can stay, like Documents: Chrome runs the extension from there.</>,
  <>In Chrome, open a new tab, type <C>chrome://extensions</C> in the address bar and press <B>Enter</B>.</>,
  <>Turn on <B>Developer mode</B>: the switch in the <B>top-right corner</B> of that page.</>,
  <>Click <B>Load unpacked</B>, the button that just appeared on the <B>top left</B>. Choose the <C>hireco-extension</C> folder (the one with <C>manifest.json</C> inside) and click <B>Select Folder</B>.</>,
  <><B>Pin it</B>: click the puzzle-piece icon to the right of the address bar, then the pin next to Hireco.</>,
];

const TIPS: [string, ReactNode][] = [
  ["“Manifest file is missing”?", <>You picked the outer folder. Windows sometimes puts <C>hireco-extension</C> inside another <C>hireco-extension</C>; open it and choose the inner one.</>],
  ["Edge, Brave or Arc?", <>Same steps. Open <C>edge://extensions</C> or <C>brave://extensions</C>. In Edge the Developer mode switch is in the left sidebar.</>],
  ["A “developer mode extensions” warning?", <>Chrome shows it for any extension installed outside the Chrome Web Store. It&apos;s expected; keep Hireco on.</>],
];

export default function InstallExtension({ download = true }: { download?: boolean }) {
  return (
    <div>
      <ol className="space-y-3 text-frost">
        {STEPS.map((s, i) => (
          <li key={i} className="flex gap-3 leading-relaxed">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-glint/50 bg-glint/10 text-xs text-glint">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        {download && <a href="/downloads/hireco-extension.zip" download className="btn-primary">↓ Download hireco-extension.zip</a>}
        <a href="/setup" className="text-sm text-ice underline decoration-white/20 underline-offset-4 hover:text-white">See every click with screenshots →</a>
      </div>
      <details className="group mt-6 rounded-2xl border border-[var(--line)] bg-white/[0.02] px-5 py-4 text-sm">
        <summary className="cursor-pointer list-none text-ice marker:hidden">
          <span className="inline-block transition group-open:rotate-90">›</span>&nbsp; Stuck? Common fixes
        </summary>
        <dl className="mt-4 space-y-3">
          {TIPS.map(([q, a]) => (
            <div key={q}>
              <dt className="text-white">{q}</dt>
              <dd className="mt-0.5 leading-relaxed text-mist">{a}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
