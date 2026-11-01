import type { AuthInfo } from "@modelcontextprotocol/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { verifyApiKey } from "@/lib/apiKeys";
import { companyIdFromUrn, runSearches, type CompanySpec } from "@/lib/companySearch";
import { enrichProspects, importProfiles, MAX_PER_CALL } from "@/lib/enrich";
import { saveExport, type ExportRow } from "@/lib/exports";
import { autoSpec, BUCKET_INFO, BUCKET_TYPES, rowsFromSpec, type MapSpec } from "@/lib/mapSpec";
import { findHiringPaths, loadConnections, loadProfile, profileUrl, searchNetwork } from "@/lib/network";
import { INSTRUCTIONS, welcome } from "@/lib/onboarding";
import { toolLimit, touchActive } from "@/lib/limits";
import { getStatus } from "@/lib/status";
import { adminClient } from "@/lib/supabase/admin";

// Tools may wait on the extension's live LinkedIn searches or on enrichment.
export const maxDuration = 300;

const userId = (ctx: { http?: { authInfo?: AuthInfo } }) => ctx.http?.authInfo?.extra?.userId as string;
const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 1) }] });
const publicIdOf = (s: string) => decodeURIComponent(s.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1] ?? s.trim());

/** Daily limits and the kill switch. Returns the friendly message to relay, or null to go ahead. */
async function gate(id: string, tool: string) {
  const blocked = await toolLimit(id, tool);
  if (blocked) return json({ limit_reached: true, tell_the_user: blocked });
  touchActive(id).catch(() => {});
  return null;
}

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
      async (_args, ctx) => (await gate(userId(ctx), "get_started")) ?? json(welcome(await getStatus(userId(ctx)))),
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
        const blocked = await gate(id, "find_hiring_paths");
        if (blocked) return blocked;
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
        const spec = autoSpec(rows, { title, me: me?.full_name ?? "You", targets: args.target_companies });
        spec.stats = [
          { value: conns.length.toLocaleString(), label: "connections searched" },
          { value: String(spec.people.length), label: "people mapped" },
          { value: String(spec.hubs.filter((h) => h.start).length), label: "places to start" },
        ];
        const links = await saveExport(id, title, rows, spec);

        // Who is worth spending premium enrichment on, best first.
        const seen = new Set<string>();
        const shortlist = (["insiders", "hiring_managers", "decision_makers", "introducers", "ex_coworkers", "recruiters"] as const)
          .flatMap((k) => buckets[k].people.filter((p) => !p.enriched).map((p) => ({ url: p.url, name: p.name, bucket: k, why: p.why })))
          .filter((p) => !seen.has(p.url) && seen.add(p.url))
          .slice(0, status.premium_enrichment.mode === "agent" ? 20 : Math.min(status.premium_enrichment.remaining, MAX_PER_CALL));

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
            note: status.premium_enrichment.mode === "agent"
              ? "Enrichment runs in this AI session: if a LinkedIn data tool is connected (e.g. the Zooq MCP profile_full, or the Apify MCP with harvestapi/linkedin-profile-scraper), offer to fetch (part of) this shortlist with it, on the user's own key and only after they agree, then save the results with import_profiles. Otherwise mention it's optional and set up at hireco.help/dashboard#enrich."
              : shortlist.length
                ? "Ask the user before calling enrich_prospects with (part of) this shortlist; it uses their early-access allowance."
                : undefined,
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
        const blocked = await gate(id, "search_my_network");
        if (blocked) return blocked;
        const conns = await loadConnections(id);
        const all = searchNetwork(conns, { ...args, limit: 1000 });
        const label = [args.query, args.company, args.title, args.seniority?.join("/")].filter(Boolean).join(" · ") || "Network search";
        const rows = all.results.map((p) => ({ bucket: "search", name: p.name, title: p.title, company: p.company, url: p.url, why: p.headline ?? "", enriched: p.enriched }));
        const me = await loadProfile(id);
        const links = await saveExport(id, label, rows, autoSpec(rows, { title: label, me: me?.full_name ?? "You" }));
        return json({ total: all.total, results: all.results.slice(0, args.limit ?? 50), ...links });
      },
    );

    server.registerTool(
      "publish_map",
      {
        title: "Publish a curated Hireco map",
        description:
          "Publishes YOUR curated radar map and returns map_url + csv_url. Use after find_hiring_paths to present the best version: group people into hubs (usually one per company, plus type groups like 'Recruiters'), order the start hubs by where the user should begin, give each hub a steps chain (warm door first, then the decision makers) and a one-line note, and each person a short 'why'. Use names, titles and LinkedIn URLs exactly as Hireco returned them.",
        inputSchema: z.object({
          title: z.string().describe("e.g. 'GTM engineer or RevOps'"),
          subtitle: z.string().optional().describe("One sentence on what the map shows"),
          people: z.array(z.object({
            id: z.string().describe("Short unique id, e.g. 'noa'"),
            name: z.string(),
            title: z.string().optional(),
            company: z.string().optional(),
            bucket: z.enum(BUCKET_TYPES),
            url: z.string().optional().describe("LinkedIn profile URL"),
            why: z.string().optional().describe("One or two sentences on why this person matters"),
          })).min(1).max(120),
          hubs: z.array(z.object({
            id: z.string(),
            label: z.string().describe("Short label shown on the map, e.g. company name"),
            full: z.string().optional().describe("Longer name for cards, e.g. 'GTM recruiters'"),
            start: z.boolean().describe("true for the ordered places to start (max 8, numbered 1..n in the order given); false for other groups (lettered A..)"),
            people: z.array(z.string()).min(1).describe("Person ids in this hub"),
            steps: z.array(z.array(z.string())).optional().describe("Chain of person-id groups, e.g. [['warm-intro'],['manager','vp']]"),
            note: z.string().optional().describe("One line: how to approach this hub"),
          })).min(1).max(16),
          footnote: z.string().optional(),
        }),
      },
      async (spec, ctx) => {
        const id = userId(ctx);
        const blocked = await gate(id, "publish_map");
        if (blocked) return blocked;
        const me = await loadProfile(id);
        const hubs = [...spec.hubs.filter((h) => h.start).slice(0, 8), ...spec.hubs.filter((h) => !h.start)];
        const full: MapSpec = { ...spec, me: me?.full_name ?? "You", hubs };
        const rows: ExportRow[] = rowsFromSpec(full).map((p) => ({
          bucket: BUCKET_INFO[p.bucket].name, name: p.name, title: p.title ?? null, company: p.company ?? null,
          url: p.url ?? "", why: [p.hub, p.why].filter(Boolean).join(" — "), enriched: false,
        }));
        return json({ ...(await saveExport(id, spec.title, rows, full)), tell_the_user: "Share map_url as 'Open your Hireco map' and csv_url as 'Download CSV'." });
      },
    );

    server.registerTool(
      "enrich_prospects",
      {
        title: "Enrich prospects (premium)",
        description: `Premium, early-access members only (premium_enrichment.mode = "house"): fetches exact titles and full dated work history for chosen connections from their allowance. Already-enriched people are free. Max ${MAX_PER_CALL} per call. Only call after the user approves the list. Everyone else enriches with their own LinkedIn data tool in this session and saves the results with import_profiles.`,
        inputSchema: z.object({ profiles: z.array(z.string()).min(1).max(MAX_PER_CALL).describe("LinkedIn profile URLs or public ids") }),
      },
      async ({ profiles }, ctx) => {
        const blocked = await gate(userId(ctx), "enrich_prospects");
        if (blocked) return blocked;
        const result = await enrichProspects(userId(ctx), profiles.map(publicIdOf));
        return json({ ...result, ...(result.enriched ? { next: "Re-run find_hiring_paths to see updated buckets with exact titles and ex-coworker overlap." } : {}) });
      },
    );

    const ym = z.object({ year: z.number().int(), month: z.number().int().min(1).max(12).optional() });
    server.registerTool(
      "import_profiles",
      {
        title: "Import enriched profiles",
        description:
          "Saves work history you fetched for the user's connections with ANOTHER tool in this session (e.g. the Zooq MCP's profile_full, the Apify MCP's LinkedIn profile scraper, or any LinkedIn data tool the user connected with their own key). This is how premium enrichment works for most members. Map the other tool's fields into this shape; only the user's own connections are updated. Then re-run find_hiring_paths.",
        inputSchema: z.object({
          profiles: z.array(z.object({
            profile: z.string().describe("LinkedIn profile URL or public id of the connection"),
            headline: z.string().optional(),
            location: z.string().optional(),
            positions: z.array(z.object({
              title: z.string().optional(),
              company: z.string().optional(),
              start: ym.optional(),
              end: ym.nullable().optional().describe("null or omitted for a current role"),
            })).describe("Work history, newest first"),
            educations: z.array(z.object({ school: z.string().optional(), degree: z.string().optional(), field: z.string().optional() })).optional(),
          })).min(1).max(MAX_PER_CALL),
        }),
      },
      async ({ profiles }, ctx) => {
        const blocked = await gate(userId(ctx), "import_profiles");
        if (blocked) return blocked;
        const result = await importProfiles(userId(ctx), profiles.map((p) => ({
          public_id: publicIdOf(p.profile),
          full_name: "",
          headline: p.headline ?? null,
          location: p.location ?? null,
          positions: p.positions.map((x) => ({ ...x, end: x.end ?? null })),
          educations: p.educations ?? [],
        })));
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
        const blocked = await gate(userId(ctx), "get_person");
        if (blocked) return blocked;
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
