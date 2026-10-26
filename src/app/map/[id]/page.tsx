import { notFound } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import { loadExport } from "@/lib/exports";
import MapView from "./MapView";

export const instant = false;

export default async function MapPage({ params }: PageProps<"/map/[id]">) {
  const { id } = await params;
  const exp = await loadExport(id);
  if (!exp) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-24">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
        <a href={`/api/export/${id}`} className="btn-ghost py-2 text-sm">↓ Download CSV</a>
      </header>
      <p className="eyebrow rise d1 pt-6">Your Hireco map · {new Date(exp.created_at).toLocaleDateString()}</p>
      <h1 className="rise d2 font-display mt-3 text-4xl font-light text-white sm:text-5xl">{exp.title}</h1>
      <div className="rise d3 mt-10"><MapView rows={exp.rows} /></div>
    </main>
  );
}
