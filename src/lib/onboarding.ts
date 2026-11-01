// What Claude tells a new user, and how it should present results.

export const INSTRUCTIONS = `Hireco maps the user's own LinkedIn network to find the people who can get them hired. Data comes from the user's Hireco Chrome extension (it syncs their 1st-degree connections and runs LinkedIn company searches in their browser).

FIRST USE: if the user is new, asks what Hireco does, or this is the first Hireco call in the conversation, call get_started and follow its steps.

CORE TOOLS
- find_hiring_paths: the main tool. Needs role_keywords (function words + title synonyms) and ideally target_companies. Returns six buckets: hiring_managers, decision_makers, insiders, recruiters, introducers, ex_coworkers.
- search_my_network: filter connections by company, title, seniority or free text.
- import_profiles: saves work history YOU fetched with the user's own LinkedIn data tool in this session (e.g. the Zooq MCP's profile_full, or the Apify MCP's harvestapi/linkedin-profile-scraper). This is how premium enrichment works.
- enrich_prospects: early-access members only (premium_enrichment.mode = "house"), from their allowance. Never spend it without the user's OK.
- publish_map: publishes your curated radar map (hubs, ordered starting points, notes) as a hosted page + CSV.
- get_person: everything known about one connection.

ALWAYS PRESENT RESULTS LIKE THIS
1. Curate: find_hiring_paths already returns an automatic map, but the best result is yours. Read the buckets, drop weak matches, group people into hubs (usually one per company, plus type groups like "Recruiters" or "GTM peers"), order up to 8 start hubs by where the user should begin, give each a steps chain (warm door first, then the decision makers) and a one-line note, and give each person a short "why". Then call publish_map.
2. A short summary in chat: the 3–5 best paths in, one line each. Warm beats senior (ex-coworker at the target > introducer > insider > recruiter > cold hiring manager).
3. Links: map_url as "Open your Hireco map" and csv_url as "Download CSV". If you can create files, also offer the CSV as a file.
4. Offer next steps: enrich the top prospects (premium), dig into a company, or draft outreach.

PREMIUM ENRICHMENT (optional, runs in this AI session)
Without enrichment, titles/companies come from headlines and LinkedIn company searches. Enrichment adds exact titles and dated work history (needed for ex-coworker overlap and to confirm who is senior where). Hireco never holds the user's provider keys. Check premium_enrichment.mode:
- "agent" (most members): if a LinkedIn data tool is connected in this session (the Zooq MCP: profile_full by handle, 10 credits each; or the Apify MCP with harvestapi/linkedin-profile-scraper, about $0.004 each), show the user the enrichment_shortlist with the count, say it runs on their own account, and only after they agree fetch the profiles with that tool. Map each result into import_profiles (title, company, start/end year+month, current role end = null, schools), then re-run find_hiring_paths. If no such tool is connected, say results already work without it, and that setup takes two minutes at hireco.help/dashboard#enrich.
- "house" (early-access members): show the shortlist with how many prospects they have left (remaining), ask for approval, then call enrich_prospects (max 50 per call) and re-run find_hiring_paths.

LIMITS
Hireco is free and runs on free servers, so there are friendly daily limits. If a result has limit_reached, relay tell_the_user as is (it's good news phrased kindly) and don't retry that tool today.

If connections = 0: tell the user to open the Hireco extension and press "Sync now".
If a result says still_running: the user's browser is running LinkedIn searches; call the tool again in about a minute.`;

export const DEMO = {
  you: "Dana — Senior Growth Manager (ex-Wix, ex-Fiverr)",
  target: "Head of Growth at Stripe or Monday.com",
  best_paths: [
    "Shira Adler — ex-coworker (Wix, 2 yrs overlap), now Growth Lead at Monday.com → ask for a referral to Noa Levi, VP Growth",
    "Lior Mizrahi — introducer, 4 yrs at Stripe → intro to Avi Cohen, CMO at Stripe",
    "Tom Ben-David — recruiter at Monday.com → direct application with Shira's referral",
  ],
};

type Enrichment = { mode: "house" | "agent"; remaining: number; total: number };

export function welcome(status: { connections: number; premium_enrichment: Enrichment }) {
  const ready = status.connections > 0;
  return {
    what_hireco_does:
      "Hireco turns the user's LinkedIn network into a hiring map: hiring managers, decision makers, insiders at target companies, recruiters, introducers (people who used to work at target companies) and ex-coworkers.",
    user_status: {
      connections_synced: status.connections,
      premium_enrichment:
        status.premium_enrichment.mode === "house"
          ? `${status.premium_enrichment.remaining} of ${status.premium_enrichment.total} early-access prospects left`
          : "runs in this AI session with the user's own LinkedIn data tool (Zooq or Apify MCP), saved via import_profiles",
    },
    present_to_the_user: [
      "Welcome them and explain Hireco in 2–3 sentences.",
      `Show the example below (say it's sample data) so they see what a result looks like: ${JSON.stringify(DEMO)}`,
      ready
        ? "Ask for their target: role, and ideally 2–5 target companies (a CV helps). Then run find_hiring_paths."
        : "Their network isn't synced yet: tell them to open the Hireco extension in Chrome and press Sync now, then come back.",
      "Mention results come as a downloadable CSV and a visual map, and that premium enrichment (exact titles and work history) is optional: " +
        (status.premium_enrichment.mode === "house" ? "they have an early-access allowance for it." : "it runs right here with their own Zooq or Apify MCP (setup at hireco.help/dashboard#enrich), and Hireco never sees their key."),
      "Suggest prompts: 'Who can get me hired as <role> at <company>?', 'Who do I know at <company>?', 'Which ex-coworkers are now managers?'",
    ],
  };
}
