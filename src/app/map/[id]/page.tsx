import { notFound } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import Radar from "@/components/radar/Radar";
import { loadExport } from "@/lib/exports";

export const instant = false;

export default async function MapPage({ params }: PageProps<"/map/[id]">) {
  const { id } = await params;
  const exp = await loadExport(id);
  if (!exp) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
        <a href={`/api/export/${id}`} className="btn-ghost py-2 text-sm">↓ Download CSV</a>
      </header>
      <p className="eyebrow rise d1 pt-4">Hireco map · {new Date(exp.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
      <h1 className="rise d2 font-display mt-3 text-4xl font-light text-white sm:text-5xl">{exp.spec.title}</h1>
      {exp.spec.subtitle && <p className="rise d2 mt-3 max-w-2xl text-mist">{exp.spec.subtitle}</p>}
      <div className="rise d3 mt-8"><Radar spec={exp.spec} /></div>
      {exp.spec.footnote && <p className="mt-10 max-w-3xl text-xs text-mist">{exp.spec.footnote}</p>}
    </main>
  );
}
