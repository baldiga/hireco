"use client";

import { useState } from "react";

export default function CopyBlock({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative">
      {label && <p className="mb-2 text-xs uppercase tracking-[0.2em] text-mist">{label}</p>}
      <pre className="code overflow-x-auto whitespace-pre-wrap break-all rounded-2xl border border-[var(--line)] bg-black/35 p-4 pr-20 leading-relaxed text-frost">{text}</pre>
      <button
        onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
        className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs text-ice transition hover:bg-white/10"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
