// Drawn frames for walkthrough steps that happen outside a web page (OS dialogs, browser
// toolbar, terminal), so they can't be screenshotted. Each marks its click target with <Ring>.
import type { ReactNode } from "react";
import { Mark } from "../Brand";

export const Ring = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`wt-ring relative inline-flex rounded-md ${className}`}>{children}</span>
);

const Folder = ({ open = false }: { open?: boolean }) => (
  <svg viewBox="0 0 20 16" className="h-4 w-5 shrink-0" aria-hidden>
    <path d="M1 3a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z" fill={open ? "#f0c25e" : "#d9a640"} />
  </svg>
);
const Zip = () => (
  <svg viewBox="0 0 16 20" className="h-5 w-4 shrink-0" aria-hidden>
    <path d="M1 2a1 1 0 0 1 1-1h8l5 5v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" fill="#c8d2ee" />
    <path d="M6 1v12" stroke="#5a6890" strokeWidth="2" strokeDasharray="1.5 1.5" />
  </svg>
);
const File = () => (
  <svg viewBox="0 0 16 20" className="h-4 w-3.5 shrink-0" aria-hidden>
    <path d="M1 2a1 1 0 0 1 1-1h8l5 5v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" fill="#8a99c6" />
  </svg>
);

// A light, OS-style window (file explorer / dialogs).
function OsWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-xl border border-white/15 bg-[#1f2330] text-[0.78rem] text-[#e4e7f0] shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#2a2f3d] px-3 py-2">
        <span>{title}</span>
        <span className="flex gap-3 text-[#9aa3b8]"><span>—</span><span>☐</span><span>✕</span></span>
      </div>
      {children}
    </div>
  );
}

export function UnzipArt() {
  return (
    <OsWindow title="Downloads">
      <div className="relative p-4">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 ring-1 ring-[#4f7dff]/60 bg-[#2f5bea]/20">
          <Zip /><span>hireco-extension.zip</span>
        </div>
        <div className="mt-1 flex items-center gap-2 px-2 py-1.5 opacity-50"><File /><span>resume-2026.pdf</span></div>
        <div className="absolute left-36 top-9 w-48 rounded-lg border border-white/15 bg-[#2a2f3d] py-1 shadow-2xl sm:left-52">
          <div className="px-3 py-1.5 text-[#9aa3b8]">Open</div>
          <div className="px-3 py-1.5"><Ring className="-mx-1.5 px-1.5 py-0.5">Extract All…</Ring></div>
          <div className="px-3 py-1.5 text-[#9aa3b8]">Share</div>
          <div className="px-3 py-1.5 text-[#9aa3b8]">Copy as path</div>
        </div>
        <div className="mt-24 flex items-center justify-between rounded-lg border border-dashed border-white/15 px-3 py-2 text-[#9aa3b8]">
          <span className="flex items-center gap-2"><Folder open /><span className="text-[#e4e7f0]">hireco-extension</span></span>
          <span>← the folder you get</span>
        </div>
      </div>
    </OsWindow>
  );
}

export function FolderPickerArt() {
  return (
    <OsWindow title="Select the extension directory">
      <div className="grid grid-cols-[8.5rem_1fr]">
        <div className="space-y-1 border-r border-white/10 p-3 text-[#9aa3b8]">
          <p>Desktop</p><p>Downloads</p><p className="text-[#e4e7f0]">Documents</p><p>Pictures</p>
        </div>
        <div className="p-3">
          <p className="mb-2 text-[#9aa3b8]">Documents</p>
          <div className="flex items-center gap-2 px-2 py-1.5 opacity-60"><Folder /><span>Invoices</span></div>
          <Ring className="w-full"><span className="flex w-full items-center gap-2 rounded-md bg-[#2f5bea]/25 px-2 py-1.5"><Folder open /><span>hireco-extension</span></span></Ring>
          <div className="ml-7 mt-1 space-y-1 text-[#9aa3b8]">
            <p className="flex items-center gap-2"><File /> manifest.json <span className="text-[#f0c25e]">← must be inside</span></p>
            <p className="flex items-center gap-2"><File /> popup.html</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-[#262a37] px-3 py-2.5">
        <span className="text-[#9aa3b8]">Folder: hireco-extension</span>
        <Ring><span className="rounded-md bg-[#2f5bea] px-3 py-1 text-white">Select Folder</span></Ring>
        <span className="rounded-md border border-white/15 px-3 py-1">Cancel</span>
      </div>
    </OsWindow>
  );
}

export function PinArt() {
  return (
    <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-xl border border-white/10 bg-[#202124] text-[0.78rem] text-[#e8eaed] shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="flex-1 truncate rounded-full bg-[#35363a] px-4 py-1.5 text-[#bdc1c6]">linkedin.com/feed</span>
        <Ring className="p-1.5">
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-label="Extensions">
            <path fill="currentColor" d="M8 2.5a1.75 1.75 0 0 1 3.5 0V4H15a1 1 0 0 1 1 1v3.5h-1.5a1.75 1.75 0 0 0 0 3.5H16V15a1 1 0 0 1-1 1h-3.5v-1.5a1.75 1.75 0 0 0-3.5 0V16H4.5a1 1 0 0 1-1-1v-3.5H5a1.75 1.75 0 0 0 0-3.5H3.5V5a1 1 0 0 1 1-1H8z" />
          </svg>
        </Ring>
        <span className="h-6 w-6 rounded-full bg-[#5f6368]" />
      </div>
      <div className="flex justify-end px-3 pb-4">
        <div className="w-64 rounded-xl border border-white/10 bg-[#292a2d] p-2 shadow-2xl">
          <p className="px-2 pb-2 pt-1 text-[#bdc1c6]">Extensions</p>
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-2 py-2">
            <Mark size={18} /><span className="flex-1">Hireco</span>
            <Ring className="p-1">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-[#8ab4f8]" aria-label="Pin">
                <path fill="currentColor" d="M12.5 2 18 7.5l-2 .5-3 3 .5 4-1.5 1.5-3.5-3.5L4 17.5 2.5 16l4.5-4.5L3.5 8 5 6.5l4 .5 3-3z" />
              </svg>
            </Ring>
          </div>
          <p className="px-2 pt-2 text-[#9aa0a6]">Manage extensions</p>
        </div>
      </div>
    </div>
  );
}

export function PasteArt() {
  return (
    <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0f1c] text-[0.76rem] shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="code ml-3 text-[0.68rem] text-mist">Terminal — claude</span>
      </div>
      <div className="code space-y-2 p-4 leading-relaxed text-frost">
        <p><span className="text-glint">&gt;</span> /plugin marketplace add https://github.com/baldiga/hireco-plugin.git</p>
        <p className="text-[#8ff0c6]">✓ Added marketplace hireco</p>
        <p><span className="text-glint">&gt;</span> /plugin install hireco@hireco</p>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-white">Hireco API key</p>
          <p className="text-mist">Starts with hk_. Get it from your dashboard.</p>
          <Ring className="mt-2 w-full"><span className="w-full rounded-md bg-black/40 px-2 py-1.5 text-ice">hk_••••••••••••••••••••••••</span></Ring>
        </div>
        <p className="text-[#8ff0c6]">✓ Installed hireco</p>
        <p><span className="text-glint">&gt;</span> /hireco:get-started</p>
      </div>
    </div>
  );
}
