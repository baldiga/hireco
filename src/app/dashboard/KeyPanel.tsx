"use client";

import { useState } from "react";
import { generateKey } from "./actions";

export default function KeyPanel({ origin }: { origin: string }) {
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mcpUrl = `${origin}/api/mcp`;
  const shownKey = key ?? "hk_YOUR_KEY";

  return (
    <section className="mt-10 rounded-xl border border-emerald-600/40 p-5">
      <h2 className="text-lg font-semibold">Your API key</h2>
      <p className="mt-1 text-sm text-neutral-500">Used by both the extension and your AI client. Shown once — store it somewhere safe.</p>
      {key ? (
        <code className="mt-3 block break-all rounded-lg bg-neutral-100 p-3 text-sm dark:bg-neutral-900">{key}</code>
      ) : (
        <button
          disabled={busy}
          onClick={async () => { setBusy(true); setKey(await generateKey()); setBusy(false); }}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Generating…" : "Generate API key"}
        </button>
      )}

      <h3 className="mt-6 font-semibold">2 · Connect your AI</h3>
      <p className="mt-1 text-sm text-neutral-500">
        Then ask Claude <i>“Get started with Hireco”</i>. More prompts and a Claude skill: <a href="/guide" className="underline">Guide</a>.
      </p>
      <p className="mt-3 text-sm font-medium">Claude Code</p>
      <code className="mt-1 block break-all rounded-lg bg-neutral-100 p-3 text-xs dark:bg-neutral-900">
        claude mcp add --transport http hireco {mcpUrl} --header &quot;Authorization: Bearer {shownKey}&quot;
      </code>
      <p className="mt-3 text-sm font-medium">Codex / Cursor / other MCP clients</p>
      <code className="mt-1 block whitespace-pre break-all rounded-lg bg-neutral-100 p-3 text-xs dark:bg-neutral-900">
        {JSON.stringify({ mcpServers: { hireco: { url: mcpUrl, headers: { Authorization: `Bearer ${shownKey}` } } } }, null, 2)}
      </code>
    </section>
  );
}
