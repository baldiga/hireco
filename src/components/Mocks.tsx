// Illustrated "screenshots" of each setup step.
import type { ReactNode } from "react";
import { Mark } from "./Brand";

function Window({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1430] shadow-[0_40px_80px_-40px_rgba(0,0,0,.9),0_0_0_1px_rgba(255,255,255,.03)_inset]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="code ml-3 truncate rounded-md bg-black/30 px-3 py-1 text-[0.68rem] text-mist">{url}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const Highlight = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`relative inline-flex rounded-lg ring-2 ring-glint/70 ring-offset-2 ring-offset-[#0b1430] ${className}`}>{children}</span>
);

export function ChromeMock() {
  return (
    <Window url="chrome://extensions">
      <div className="flex items-center justify-between">
        <span className="text-sm font-normal text-white">Extensions</span>
        <Highlight className="items-center gap-2 px-2 py-1 text-[0.7rem] text-frost">
          Developer mode
          <span className="relative h-4 w-7 rounded-full bg-azure"><span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white" /></span>
        </Highlight>
      </div>
      <div className="mt-4 flex gap-2 text-[0.7rem]">
        <Highlight><span className="rounded-lg border border-azure/50 bg-azure/15 px-3 py-1.5 text-ice">Load unpacked</span></Highlight>
        <span className="rounded-lg border border-white/10 px-3 py-1.5 text-mist">Pack extension</span>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
        <Mark size={28} />
        <div className="text-xs">
          <p className="text-white">Hireco <span className="text-mist">0.4.0</span></p>
          <p className="text-mist">Maps your LinkedIn network for your AI agent</p>
        </div>
        <span className="ml-auto h-4 w-7 rounded-full bg-azure/80" />
      </div>
    </Window>
  );
}

export function PopupMock() {
  return (
    <div className="mx-auto w-full max-w-[290px] overflow-hidden rounded-2xl border border-white/10 p-4 shadow-[0_40px_80px_-40px_rgba(0,0,0,.9)]"
      style={{ background: "radial-gradient(120% 80% at 100% 0%, #16307a 0%, transparent 55%), #040a1c" }}>
      <div className="flex items-center gap-2"><Mark size={18} /><span className="font-display text-lg text-white">Hireco</span></div>
      <p className="font-display mt-3 text-2xl font-light text-white">Hello, Dana</p>
      <p className="text-[0.7rem] text-mist">dana@example.com</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[["1,284", "connections"], ["300", "premium prospects"]].map(([n, l]) => (
          <div key={l} className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
            <p className="font-display text-2xl font-light leading-none text-white">{n}</p>
            <p className="mt-1 text-[0.65rem] text-mist">{l}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[0.7rem] text-glint">Synced 1,240 connections…</p>
      <div className="btn-primary mt-2 w-full py-2 text-xs">Sync now</div>
    </div>
  );
}

export function TerminalMock() {
  return (
    <Window url="Terminal — claude">
      <p className="code leading-relaxed text-frost">
        <span className="text-glint">$</span> claude mcp add --transport http hireco \<br />
        &nbsp;&nbsp;https://hireco.help/api/mcp \<br />
        &nbsp;&nbsp;--header <span className="text-champagne">&quot;Authorization: Bearer hk_••••&quot;</span>
      </p>
      <p className="code mt-3 text-[#8ff0c6]">✓ Added HTTP MCP server hireco</p>
    </Window>
  );
}

export function ChatMock() {
  return (
    <Window url="Claude">
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-azure/20 px-3.5 py-2 text-[0.8rem] text-frost">
        Who in my network can get me hired as Head of Growth at Stripe?
      </div>
      <div className="mt-3 max-w-[95%] text-[0.8rem] leading-relaxed text-frost">
        <p className="text-mist">Your 3 best paths in:</p>
        <ol className="mt-1.5 space-y-1">
          <li><span className="text-glint">1.</span> <b className="font-normal text-white">Shira A.</b> — ex-coworker, now at Stripe → ask for a referral</li>
          <li><span className="text-glint">2.</span> <b className="font-normal text-white">Lior M.</b> — 4 yrs at Stripe → intro to the CMO</li>
          <li><span className="text-glint">3.</span> <b className="font-normal text-white">Tom B.</b> — recruiter at Stripe</li>
        </ol>
        <div className="mt-3 flex gap-2 text-[0.7rem]">
          <span className="rounded-full border border-white/15 px-3 py-1 text-ice">↓ Download CSV</span>
          <span className="rounded-full border border-glint/40 bg-glint/10 px-3 py-1 text-glint">Open your Hireco map</span>
        </div>
      </div>
    </Window>
  );
}
