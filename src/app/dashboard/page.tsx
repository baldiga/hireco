import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStatus } from "@/lib/status";
import { serverClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import KeyPanel from "./KeyPanel";

// Per-user page: render on request.
export const instant = false;

export default async function Dashboard() {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const status = await getStatus(data.user.id);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const stats = [
    ["LinkedIn account", status.linkedin_account?.name ?? "Not connected yet"],
    ["Connections synced", status.connections.toLocaleString()],
    ["With work history", `${status.enriched_with_work_history.toLocaleString()} / ${status.connections.toLocaleString()}`],
    ["Last sync", status.last_sync ? `${status.last_sync.status} · ${new Date(status.last_sync.started_at).toLocaleString()}` : "Never"],
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hireco</h1>
        <form action={signOut}>
          <button className="text-sm text-neutral-500 hover:underline">{data.user.email} · Sign out</button>
        </form>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <dt className="text-xs text-neutral-500">{k}</dt>
            <dd className="mt-1 font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <KeyPanel origin={origin} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold">1 · Install the extension</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-neutral-600 dark:text-neutral-400">
          <li>Open <code>chrome://extensions</code>, turn on <b>Developer mode</b>.</li>
          <li>Click <b>Load unpacked</b> and pick the <code>extension</code> folder from the Hireco repo.</li>
          <li>Open the Hireco extension, paste your API key, press <b>Sync now</b>.</li>
        </ol>
      </section>
    </main>
  );
}
