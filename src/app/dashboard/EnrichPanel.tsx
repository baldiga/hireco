"use client";

import { useState, useTransition } from "react";
import CopyBlock from "@/components/CopyBlock";
import { setMarketing } from "./actions";

// Members' provider keys never reach Hireco: they connect the provider's own MCP to their AI,
// which fetches profiles and saves the results with import_profiles.
const PROVIDERS = {
  zooq: {
    name: "Zooq",
    command: `claude mcp add --transport http zooq https://zooq.dev/api/mcp --header "X-API-Key: zq_YOUR_KEY"`,
    key: "Get a key at zooq.dev (300 free credits, about 30 profiles). It goes only into your AI's settings.",
    docs: "https://zooq.dev/docs",
  },
  apify: {
    name: "Apify",
    command: `claude mcp add --transport http apify "https://mcp.apify.com?tools=harvestapi/linkedin-profile-scraper"`,
    key: "You sign in to Apify in the browser the first time; no key to paste. About $4 per 1,000 profiles, and the free plan covers roughly 1,000 a month.",
    docs: "https://docs.apify.com/platform/integrations/mcp",
  },
} as const;

/** Premium enrichment that runs in the member's own AI, on their own provider account. */
export function EnrichPanel({ house }: { house: { remaining: number; total: number } | null }) {
  const [provider, setProvider] = useState<keyof typeof PROVIDERS>("zooq");
  const info = PROVIDERS[provider];
  return (
    <div className="grid gap-5">
      <p className="text-mist">
        Optional. Enrichment adds exact titles and full work history to the people your AI picks, so it can spot ex-coworkers and confirm who&apos;s senior.
        It runs in your own AI: connect a LinkedIn data tool with your own account, and your AI saves the results to Hireco.
        <b className="font-normal text-frost"> Your key stays in your AI app; Hireco never sees it.</b>
      </p>
      {house && house.remaining > 0 && (
        <p className="text-sm text-frost">As an early-access member you also have {house.remaining} of {house.total} prospects on us, no setup needed.</p>
      )}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Provider">
        {(Object.keys(PROVIDERS) as (keyof typeof PROVIDERS)[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={provider === p}
            onClick={() => setProvider(p)}
            className={`rounded-full border px-4 py-2 text-sm transition ${provider === p ? "border-glint/60 bg-glint/10 text-white" : "border-[var(--line-strong)] text-mist hover:text-frost"}`}
          >
            {PROVIDERS[p].name}
          </button>
        ))}
      </div>
      <CopyBlock label="Claude Code" text={info.command} />
      <p className="text-sm text-mist">
        {info.key} Using another AI app? Add the same server in its MCP settings (<a href={info.docs} target="_blank" rel="noreferrer" className="text-ice underline decoration-white/20 underline-offset-4">{info.name} docs</a>).
      </p>
      <p className="text-sm text-mist">Then just ask: <i className="text-frost">&ldquo;Enrich the top 10 people on my shortlist.&rdquo;</i></p>
    </div>
  );
}

export function MarketingToggle({ optedIn }: { optedIn: boolean }) {
  const [on, setOn] = useState(optedIn);
  const [pending, start] = useTransition();
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-mist">
      <input
        type="checkbox"
        checked={on}
        disabled={pending}
        onChange={(e) => { const v = e.target.checked; setOn(v); start(() => setMarketing(v)); }}
        className="h-4 w-4 accent-[var(--color-azure)]"
      />
      Email me product updates and tips (a few a month at most)
    </label>
  );
}
