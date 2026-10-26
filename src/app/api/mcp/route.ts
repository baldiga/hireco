import type { AuthInfo } from "@modelcontextprotocol/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { verifyApiKey } from "@/lib/apiKeys";
import { findHiringPaths, loadConnections, loadProfile, profileUrl, searchNetwork } from "@/lib/network";
import { welcome } from "@/lib/onboarding";
import { getStatus } from "@/lib/status";
import { adminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const INSTRUCTIONS = `Hireco maps the user's own LinkedIn network to find people who can get them hired.
Data comes from the user's Hireco browser extension, which syncs their 1st-degree connections and gradually enriches them with full work history.

If the user is new to Hireco, asks what it can do, or this is the first Hireco use in the conversation, call get_started and follow its how_to_present_this_to_the_user steps (including the example map artifact).

Typical flow:
1. get_sync_status — check data is there. If connections = 0, tell the user to install the extension and press "Sync now".
2. Understand the target: read the user's CV / ask for target role, function, seniority, companies, location. get_my_profile gives their LinkedIn work history.
3. find_hiring_paths with role_keywords (function words + title synonyms, e.g. ["growth","marketing","demand gen"]) and target_companies.
4. Use search_my_network for follow-ups (a specific company, title, or keyword).
5. Rank the best paths for the user and explain why each person matters. Draft short, personal outreach messages when asked.
6. If key people are not enriched yet, call request_enrichment so the extension fetches their work history next.
7. When showing results, prefer an interactive Hireco map artifact (see map_artifact_spec in get_started).`;

const userId = (ctx: { http?: { authInfo?: AuthInfo } }) => ctx.http?.authInfo?.extra?.userId as string;
const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 1) }] });
const publicIdOf = (s: string) => s.match(/linkedin\.com\/in\/([^/?#]+)/)?.[1] ?? s.trim();

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "get_started",
      {
        title: "Get started with Hireco",
        description: "Onboarding: what Hireco does, the user's sync status, a demo network and the spec for an example Hireco map artifact. Call when the user is new or asks what Hireco can do.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => json(welcome(await getStatus(userId(ctx)))),
    );

    server.registerPrompt(
      "get-started",
      { title: "Get started with Hireco", description: "A guided tour: what Hireco can do, with an example map" },
      () => ({
        messages: [{ role: "user", content: { type: "text", text: "I just connected Hireco. Call get_started, explain what you can do for me, and show me the example Hireco map." } }],
      }),
    );

    server.registerPrompt(
      "hiring-map",
      {
        title: "Build my hiring map",
        description: "Find who in your network can get you hired for a role",
        argsSchema: z.object({
          role: z.string().describe("Target role, e.g. Head of Growth"),
          companies: z.string().optional().describe("Target companies, comma separated"),
        }),
      },
      ({ role, companies }) => ({
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `I'm looking for a ${role} role${companies ? ` at ${companies}` : ""}. Check my Hireco sync status and my LinkedIn profile, run find_hiring_paths with good keywords for this role, then build my interactive Hireco map artifact and tell me the 5 best paths in, with a draft intro message for the top one.`,
          },
        }],
      }),
    );

    server.registerTool(
      "get_sync_status",
      {
        title: "Sync status",
        description: "How many LinkedIn connections are synced and how many have full work history. Call first.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => json(await getStatus(userId(ctx))),
    );

    server.registerTool(
      "get_my_profile",
      {
        title: "My LinkedIn profile",
        description: "The user's own LinkedIn headline, work history and education, as synced by the extension.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => json(await loadProfile(userId(ctx))),
    );

    server.registerTool(
      "find_hiring_paths",
      {
        title: "Find hiring paths",
        description:
          "Sorts the user's connections into buckets: hiring_managers, decision_makers, insiders (at target companies), recruiters, introducers (used to work at target companies) and ex_coworkers.",
        inputSchema: z.object({
          role_keywords: z.array(z.string()).min(1).describe("Function / title keywords for the target role, e.g. ['product', 'pm'] or ['growth','marketing']"),
          target_companies: z.array(z.string()).optional().describe("Companies the user wants to work at"),
          limit_per_bucket: z.number().int().min(1).max(100).optional(),
        }),
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => {
        const id = userId(ctx);
        const [conns, me] = await Promise.all([loadConnections(id), loadProfile(id)]);
        return json(findHiringPaths(conns, me, args));
      },
    );

    server.registerTool(
      "search_my_network",
      {
        title: "Search my network",
        description: "Filter the user's connections by free text, company, title keywords or seniority. Comma-separate alternatives (e.g. title: 'cto, vp engineering').",
        inputSchema: z.object({
          query: z.string().optional().describe("Free text across name, headline, title, company and past positions"),
          company: z.string().optional(),
          include_past: z.boolean().optional().describe("Also match people who used to work at `company`"),
          title: z.string().optional(),
          seniority: z.array(z.enum(["c_level", "vp", "head", "director", "manager", "ic"])).optional(),
          limit: z.number().int().min(1).max(200).optional(),
        }),
        annotations: { readOnlyHint: true },
      },
      async (args, ctx) => json(searchNetwork(await loadConnections(userId(ctx)), args)),
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

    server.registerTool(
      "request_enrichment",
      {
        title: "Request enrichment",
        description: "Moves these connections to the front of the extension's queue so their full work history is fetched next (a few per minute while the browser is open).",
        inputSchema: z.object({ profiles: z.array(z.string()).min(1).max(100).describe("LinkedIn profile URLs or public ids") }),
      },
      async ({ profiles }, ctx) => {
        const { data, error } = await adminClient()
          .from("connections")
          .update({ enrich_priority: 10, enrich_error: null })
          .eq("user_id", userId(ctx))
          .in("public_id", profiles.map(publicIdOf))
          .select("public_id");
        if (error) throw error;
        return json({ queued: data.length, not_found: profiles.length - data.length });
      },
    );
  },
  { serverInfo: { name: "hireco", version: "0.1.0" }, instructions: INSTRUCTIONS },
);

const verifyToken = async (_req: Request, token?: string): Promise<AuthInfo | undefined> => {
  const id = await verifyApiKey(token);
  return id ? { token: token!, clientId: id, scopes: [], extra: { userId: id } } : undefined;
};

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
