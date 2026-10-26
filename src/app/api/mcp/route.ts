import type { AuthInfo } from "@modelcontextprotocol/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { verifyApiKey } from "@/lib/apiKeys";
import { companyIdFromUrn, runSearches, type CompanySpec } from "@/lib/companySearch";
import { enrichProspects, MAX_PER_CALL } from "@/lib/enrich";
import { saveExport, type ExportRow } from "@/lib/exports";
import { findHiringPaths, loadConnections, loadProfile, profileUrl, searchNetwork } from "@/lib/network";
import { INSTRUCTIONS, welcome } from "@/lib/onboarding";
import { getStatus } from "@/lib/status";
import { adminClient } from "@/lib/supabase/admin";

// Tools may wait on the extension's live LinkedIn searches or on enrichment.
export const maxDuration = 300;

const userId = (ctx: { http?: { authInfo?: AuthInfo } }) => ctx.http?.authInfo?.extra?.userId as string;
const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 1) }] });
const publicIdOf = (s: string) => decodeURIComponent(s.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1] ?? s.trim());

type Person = { name: string; url: string; title: string | null; company: string | null; why: string; enriched: boolean; at_target?: boolean };

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "get_started",
      {
        title: "Get started with Hireco",
        description: "Onboarding: what Hireco does, the user's sync status and premium allowance, a sample result, and how to guide them. Call on first use.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => json(welcome(await getStatus(userId(ctx)))),
    );

    server.registerPrompt(
      "get-started",
      { title: "Get started with Hireco", description: "What Hireco can do, with a sample result" },
      () => ({ messages: [{ role: "user", content: { type: "text", text: "I just connected Hireco. Call get_started and walk me through what you can do for me." } }] }),
    );

    server.registerPrompt(
      "find-paths",
      {
        title: "Find my paths in",
        description: "Who in your network can get you hired for a role",
        argsSchema: z.object({
          role: z.string().describe("Target role, e.g. Head of Growth"),
          companies: z.string().optional().describe("Target companies, comma separated"),
        }),
      },
      ({ role, companies }) => ({
        messages: [{
          role: "user",
          content: { type: "text", text: `I'm looking for a ${role} role${companies ? ` at ${companies}` : ""}. Use Hireco to find who in my network can get me hired: give me the best paths in, the CSV and the map.` },
        }],
      }),
    );

    server.registerTool(
      "find_hiring_paths",
      {
        title: "Find hiring paths",
        description:
          "Main tool. Maps the user's connections into hiring_managers, decision_makers, insiders, recruiters, introducers and ex_coworkers for a target role (and target companies). Returns top people per bucket, csv_url, map_url, and a premium enrichment shortlist. May take up to a minute the first time a company is searched.",
        inputSchema: z.object({
          role_keywords: z.array(z.string()).min(1).describe("Function / title keywords for the target role, e.g. ['growth','marketing','acquisition']"),
          target_companies: z.array(z.string()).optional().describe("Companies the user wants to work at"),
          title: z.string().optional().describe("Short label for the export, e.g. 'Head of Growth — Stripe, Monday.com'"),
          limit_per_bucket: z.number().int().min(1).max(50).optional().describe("People per bucket in this response (default 10). The CSV has everyone."),
        }),
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        const id = userId(ctx);
        const me = await loadProfile(id);
        const myCompanies = [...new Map((me?.positions ?? []).filter((p) => p.company).map((p) => [p.company!, p])).values()].slice(0, 8);
        const specs: CompanySpec[] = [
          ...(args.target_companies ?? []).flatMap((company) => (["current", "past"] as const).map((relation) => ({ company, relation }))),
          ...myCompanies.flatMap((p) => (["current", "past"] as const).map((relation) => ({ company: p.company!, companyId: companyIdFromUrn(p.companyUrn), relation }))),
        ];
        const [conns, searches, status] = await Promise.all([loadConnections(id), runSearches(id, specs), getStatus(id)]);
        // Everyone goes into the export; the response is trimmed below.
        const full = findHiringPaths(conns, me, { ...args, limit_per_bucket: 1000 }, searches.results.filter((r) => r.status === "done"));
        const buckets = full.buckets as Record<string, { total: number; people: Person[] }>;

        const rows: ExportRow[] = Object.entries(buckets).flatMap(([bucket, b]) =>
          b.people.map((p) => ({ bucket, name: p.name, title: p.title, company: p.company, url: p.url, why: p.why, enriched: p.enriched })),
        );
        const title = args.title ?? [args.role_keywords.join(", "), args.target_companies?.join(", ")].filter(Boolean).join(" — ");
        const links = await saveExport(id, title, rows);

        // Who is worth spending premium enrichment on, best first.
        const seen = new Set<string>();
        const shortlist = (["insiders", "hiring_managers", "decision_makers", "introducers", "ex_coworkers", "recruiters"] as const)
          .flatMap((k) => buckets[k].people.filter((p) => !p.enriched).map((p) => ({ url: p.url, name: p.name, bucket: k, why: p.why })))
          .filter((p) => !seen.has(p.url) && seen.add(p.url))
          .slice(0, Math.min(status.premium_enrichment.remaining, MAX_PER_CALL));

        const limit = args.limit_per_bucket ?? 10;
        return json({
          ...(searches.pending ? { still_running: `${searches.pending} LinkedIn company searches are still running in the user's browser. Call again in about a minute for complete results.` } : {}),
          coverage: full.coverage,
          buckets: Object.fromEntries(Object.entries(buckets).map(([k, b]) => [k, { total: b.total, people: b.people.slice(0, limit) }])),
          csv_url: links.csv_url,
          map_url: links.map_url,
          premium_enrichment: {
            ...status.premium_enrichment,
            enrichment_shortlist: shortlist,
            note: shortlist.length ? "Ask the user before calling enrich_prospects with (part of) this shortlist." : undefined,
          },
        });
      },
    );

    server.registerTool(
      "search_my_network",
      {
        title: "Search my network",
        description: "Filter the user's connections by free text, company, title keywords or seniority (comma-separate alternatives, e.g. title: 'cto, vp engineering'). Returns matches plus csv_url and map_url.",
        inputSchema: z.object({
          query: z.string().optional().describe("Free text across name, headline, title, company and past positions"),
          company: z.string().optional(),
          include_past: z.boolean().optional().describe("Also match people who used to work at `company` (needs enriched history)"),
          title: z.string().optional(),
          seniority: z.array(z.enum(["c_level", "vp", "head", "director", "manager", "ic"])).optional(),
          limit: z.number().int().min(1).max(200).optional(),
        }),
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        const id = userId(ctx);
        const conns = await loadConnections(id);
        const all = searchNetwork(conns, { ...args, limit: 1000 });
        const label = [args.query, args.company, args.title, args.seniority?.join("/")].filter(Boolean).join(" · ") || "Network search";
        const links = await saveExport(
          id,
          label,
          all.results.map((p) => ({ bucket: "search", name: p.name, title: p.title, company: p.company, url: p.url, why: p.headline ?? "", enriched: p.enriched })),
        );
        return json({ total: all.total, results: all.results.slice(0, args.limit ?? 50), ...links });
      },
    );

    server.registerTool(
      "enrich_prospects",
      {
        title: "Enrich prospects (premium)",
        description: `Premium: fetches exact titles and full dated work history for chosen connections. Each new person uses 1 prospect from the user's allowance (already-enriched people are free). Max ${MAX_PER_CALL} per call. Only call after the user approves the list.`,
        inputSchema: z.object({ profiles: z.array(z.string()).min(1).max(MAX_PER_CALL).describe("LinkedIn profile URLs or public ids") }),
      },
      async ({ profiles }, ctx) => {
        const result = await enrichProspects(userId(ctx), profiles.map(publicIdOf));
        return json({ ...result, next: "Re-run find_hiring_paths to see updated buckets with exact titles and ex-coworker overlap." });
      },
    );

    server.registerTool(
      "get_person",
      {
        title: "Get person",
        description: "Everything Hireco knows about one connection, including full work history if enriched.",
        inputSchema: z.object({ profile: z.string().describe("LinkedIn profile URL or public id") }),
        annotations: { readOnlyHint: true },
      },
      async ({ profile }, ctx) => {
        const { data } = await adminClient()
          .from("connections")
          .select("public_id, first_name, last_name, headline, current_title, current_company, location, positions, educations, connected_at, enriched_at")
          .eq("user_id", userId(ctx))
          .eq("public_id", publicIdOf(profile))
          .maybeSingle();
        return json(data ? { ...data, url: profileUrl(data.public_id) } : { error: "Not one of the user's synced connections." });
      },
    );
  },
  { serverInfo: { name: "hireco", version: "0.4.0" }, instructions: INSTRUCTIONS },
);

const verifyToken = async (_req: Request, token?: string): Promise<AuthInfo | undefined> => {
  const id = await verifyApiKey(token);
  return id ? { token: token!, clientId: id, scopes: [], extra: { userId: id } } : undefined;
};

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
