import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import manifest from "../../../extension/manifest.json";
import CopyBlock from "@/components/CopyBlock";
import InstallExtension from "@/components/InstallExtension";
import { ChromeMock } from "@/components/Mocks";
import { accessFor } from "@/lib/access";
import { getStatus } from "@/lib/status";
import { adminClient } from "@/lib/supabase/admin";
import { serverClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { EnrichPanel, MarketingToggle } from "./EnrichPanel";
import KeyPanel, { Step } from "./KeyPanel";

// Per-user page: render on request.
export const instant = false;

const PROMPTS = [
  "Get started with Hireco",
  "Who in my network can get me hired as a Head of Growth at Stripe or Monday.com?",
  "Who do I know at Wiz, and who used to work there?",
];

export default async function Dashboard() {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if ((await accessFor(data.user.email)) !== "approved") {
    await supabase.auth.signOut();
    redirect("/login");
  }

  const db = adminClient();
  const [status, keys, membership] = await Promise.all([
    getStatus(data.user.id),
    db.from("api_keys").select("id", { count: "exact", head: true }).eq("user_id", data.user.id).is("revoked_at", null),
    db.from("waitlist").select("marketing_opt_in").eq("email", data.user.email!.toLowerCase()).maybeSingle(),
  ]);
  const enrichment = status.premium_enrichment;
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const synced = status.connections > 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-24">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
        <form action={signOut} className="flex items-center gap-4 text-sm text-mist">
          <Link href="/guide" className="hover:text-frost">Guide</Link>
          <span className="hidden sm:inline">{data.user.email}</span>
          <button className="hover:text-frost">Sign out</button>
        </form>
      </header>

      <section className="rise d1 pt-8">
        <p className="eyebrow">Your setup</p>
        <h1 className="font-display mt-3 text-5xl font-light text-white">
          {synced ? <>Your network is <em className="text-gradient">mapped</em>.</> : <>Let&apos;s map your <em className="text-gradient">network</em>.</>}
        </h1>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            [status.connections.toLocaleString(), "connections synced"],
            enrichment.mode === "house"
              ? [`${enrichment.remaining}`, `of ${enrichment.total} premium prospects left`]
              : [`${status.enriched_count}`, "people enriched by your AI"],
            [status.last_sync ? new Date(status.last_sync.started_at).toLocaleDateString() : "—", "last sync"],
          ].map(([n, l]) => (
            <div key={l} className="panel p-5">
              <p className="font-display text-4xl font-light text-white">{n}</p>
              <p className="mt-1 text-sm text-mist">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {!synced && (
        <Link href="/setup" className="rise d2 panel mt-8 flex items-center justify-between gap-4 p-5 transition hover:bg-white/[0.04]">
          <span>
            <span className="block text-white">First time? Follow the walkthrough.</span>
            <span className="block text-sm text-mist">Every click, with screenshots: extension, key, sync and your AI.</span>
          </span>
          <span className="text-ice">→</span>
        </Link>
      )}

      <div className="rise d2 mt-12 grid gap-5">
        <Step n="01" title="Install the Chrome extension">
          <p className="mb-5 text-mist">
            A small extension that reads your connections from your own logged-in LinkedIn. It isn&apos;t in the Chrome Web Store yet, so you add it with Developer mode:
          </p>
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
            <InstallExtension />
            <ChromeMock version={manifest.version} />
          </div>
        </Step>

        <KeyPanel origin={origin} hasKey={(keys.count ?? 0) > 0}>
          <Step n="03" title="Sync your connections" done={synced}>
            <p className="text-mist">
              {synced
                ? `${status.connections.toLocaleString()} connections synced. Press Sync again in the extension whenever you like — it also refreshes daily.`
                : "Make sure you're signed in to LinkedIn in this browser, then press Sync now in the extension. A few thousand connections take a couple of minutes."}
            </p>
          </Step>
        </KeyPanel>

        <Step n="05" title="Ask your first question">
          <p className="text-mist">In your AI, try one of these. Results come with a CSV and a visual map.</p>
          <div className="mt-4 grid gap-3">{PROMPTS.map((p) => <CopyBlock key={p} text={p} />)}</div>
          <Link href="/guide" className="btn-ghost mt-5">Skills &amp; prompts guide →</Link>
        </Step>

        <Step n="06" title="Premium enrichment (optional)" id="enrich">
          <EnrichPanel house={enrichment.total ? { remaining: enrichment.remaining, total: enrichment.total } : null} />
        </Step>
      </div>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
        <MarketingToggle optedIn={!!membership.data?.marketing_opt_in} />
        <span className="text-xs text-mist">Want your data deleted? <a href="mailto:hello@hireco.help" className="text-ice">hello@hireco.help</a></span>
      </footer>
    </main>
  );
}
