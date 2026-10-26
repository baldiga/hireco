import { loadExport, toCsv } from "@/lib/exports";

export async function GET(_req: Request, ctx: RouteContext<"/api/export/[id]">) {
  const { id } = await ctx.params;
  const exp = await loadExport(id);
  if (!exp) return new Response("Not found", { status: 404 });
  const filename = `hireco-${exp.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.csv`;
  return new Response("﻿" + toCsv(exp.rows), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}"` },
  });
}
