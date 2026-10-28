"use client";

import { useState } from "react";
import ConnectAgent from "@/components/ConnectAgent";
import CopyBlock from "@/components/CopyBlock";
import { generateKey } from "./actions";

// Step 2 (key) and step 4 (connect your AI) share the generated key.
export default function KeyPanel({ origin, hasKey, children }: { origin: string; hasKey: boolean; children: React.ReactNode }) {
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mcpUrl = `${origin}/api/mcp`;

  return (
    <>
      <Step n="02" title="Get your API key" done={hasKey || !!key}>
        <p className="text-mist">The extension and your AI both use it. It&apos;s shown once — keep it somewhere safe.</p>
        {key ? (
          <div className="mt-4"><CopyBlock text={key} /></div>
        ) : (
          <button
            disabled={busy}
            onClick={async () => { setBusy(true); setKey(await generateKey()); setBusy(false); }}
            className="btn-primary mt-4"
          >
            {busy ? "Generating…" : hasKey ? "Generate a new key" : "Generate API key"}
          </button>
        )}
        <p className="mt-4 text-sm text-mist">Then open the Hireco extension, paste the key and press <b className="font-normal text-frost">Sync now</b>.</p>
      </Step>

      {children}

      <Step n="04" title="Connect your AI" id="connect">
        <p className="mb-5 text-mist">
          {key ? "Your new key is already filled in below." : hasKey ? "Paste your key where you see hk_YOUR_KEY, or generate a new one above to have it filled in." : "Generate your key above and it's filled in below."}
        </p>
        <ConnectAgent url={mcpUrl} apiKey={key} />
      </Step>
    </>
  );
}

export function Step({ n, title, done, id, children }: { n: string; title: string; done?: boolean; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="panel scroll-mt-8 p-7 sm:p-8">
      <div className="flex items-center gap-4">
        <span className={`grid h-10 w-10 place-items-center rounded-full border text-sm ${done ? "border-glint/60 bg-glint/10 text-glint" : "border-[var(--line-strong)] text-ice"}`}>
          {done ? "✓" : n}
        </span>
        <h2 className="font-display text-2xl font-normal text-white">{title}</h2>
      </div>
      <div className="mt-5 sm:pl-14">{children}</div>
    </section>
  );
}
