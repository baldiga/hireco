import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import CopyBlock from "@/components/CopyBlock";
import { accessFor } from "@/lib/access";
import { getStatus } from "@/lib/status";
import { adminClient } from "@/lib/supabase/admin";
import { serverClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
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

  const [status, keys] = await Promise.all([
    getStatus(data.user.id),
    adminClient().from("api_keys").select("id", { count: "exact", head: true }).eq("user_id", data.user.id).is("revoked_at", null),
  ]);
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
            [`${status.premium_enrichment.remaining}`, `of ${status.premium_enrichment.total} premium prospects left`],
            [status.last_sync ? new Date(status.last_sync.started_at).toLocaleDateString() : "—", "last sync"],
          ].map(([n, l]) => (
            <div key={l} className="panel p-5">
              <p className="font-display text-4xl font-light text-white">{n}</p>
              <p className="mt-1 text-sm text-mist">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rise d2 mt-12 grid gap-5">
        <Step n="01" title="Download the extension">
          <p className="text-mist">A small Chrome extension that reads your connections from your own logged-in LinkedIn.</p>
          <a href="/downloads/hireco-extension.zip" download className="btn-primary mt-4">↓ Download hireco-extension.zip</a>
        </Step>

        <Step n="02" title="Install it in Chrome">
          <ol className="list-decimal space-y-1.5 pl-5 text-frost marker:text-mist">
            <li>Unzip the file.</li>
            <li>Open <span className="code rounded bg-black/30 px-1.5 py-0.5">chrome://extensions</span> and turn on <b className="font-normal text-white">Developer mode</b> (top right).</li>
            <li>Click <b className="font-normal text-white">Load unpacked</b> and choose the <span className="code">hireco-extension</span> folder.</li>
            <li>Pin Hireco from the puzzle-piece menu so it&apos;s one click away.</li>
          </ol>
        </Step>

        <KeyPanel origin={origin} hasKey={(keys.count ?? 0) > 0}>
          <Step n="04" title="Sync your connections" done={synced}>
            <p className="text-mist">
              {synced
                ? `${status.connections.toLocaleString()} connections synced. Press Sync again in the extension whenever you like — it also refreshes daily.`
                : "Make sure you're signed in to LinkedIn in this browser, then press Sync now in the extension. A few thousand connections take a couple of minutes."}
            </p>
          </Step>
        </KeyPanel>

        <Step n="06" title="Ask your first question">
          <p className="text-mist">In your AI, try one of these. Results come with a CSV and a visual map.</p>
          <div className="mt-4 grid gap-3">{PROMPTS.map((p) => <CopyBlock key={p} text={p} />)}</div>
          <Link href="/guide" className="btn-ghost mt-5">Skills &amp; prompts guide →</Link>
        </Step>
      </div>
    </main>
  );
}
