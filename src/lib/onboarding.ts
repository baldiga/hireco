// What Claude tells a new user, and how it should present results.

export const INSTRUCTIONS = `Hireco maps the user's own LinkedIn network to find the people who can get them hired. Data comes from the user's Hireco Chrome extension (it syncs their 1st-degree connections and runs LinkedIn company searches in their browser).

FIRST USE: if the user is new, asks what Hireco does, or this is the first Hireco call in the conversation, call get_started and follow its steps.

CORE TOOLS
- find_hiring_paths: the main tool. Needs role_keywords (function words + title synonyms) and ideally target_companies. Returns six buckets: hiring_managers, decision_makers, insiders, recruiters, introducers, ex_coworkers.
- search_my_network: filter connections by company, title, seniority or free text.
- enrich_prospects (premium): adds full work history to chosen people. Capped per user (see premium_enrichment.remaining). Never spend it without the user's OK.
- get_person: everything known about one connection.

ALWAYS PRESENT RESULTS LIKE THIS
1. A short summary: the 3–5 best paths in, one line each on why. Warm beats senior (ex-coworker at the target > introducer > insider > recruiter > cold hiring manager).
2. The CSV: give the csv_url link as "Download CSV". If you can create files or artifacts, also offer the same table as a CSV file.
3. The visual map: give the map_url link ("Open your Hireco map"). If you can create artifacts, you may also build an interactive map.
4. Offer next steps: enrich the top prospects (premium), dig into a company, or draft outreach.

PREMIUM ENRICHMENT (capped, e.g. 300 prospects per user)
Without enrichment, titles/companies come from headlines and LinkedIn company searches. Enrichment adds exact titles and dated work history (needed for ex-coworker overlap and to confirm who is senior where).
When remaining > 0: build a shortlist from find_hiring_paths' enrichment_shortlist (people at target companies with unclear titles, likely hiring managers/decision makers, introducers). Show the user the list with the count and how many prospects they have left, ask for approval, then call enrich_prospects (max 50 per call) and re-run find_hiring_paths.
When remaining = 0: tell the user they've used their prospect allowance; results still work from headlines and company searches.

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

export function welcome(status: { connections: number; premium_enrichment: { remaining: number; total: number } }) {
  const ready = status.connections > 0;
  return {
    what_hireco_does:
      "Hireco turns the user's LinkedIn network into a hiring map: hiring managers, decision makers, insiders at target companies, recruiters, introducers (people who used to work at target companies) and ex-coworkers.",
    user_status: {
      connections_synced: status.connections,
      premium_prospects_left: `${status.premium_enrichment.remaining} of ${status.premium_enrichment.total}`,
    },
    present_to_the_user: [
      "Welcome them and explain Hireco in 2–3 sentences.",
      `Show the example below (say it's sample data) so they see what a result looks like: ${JSON.stringify(DEMO)}`,
      ready
        ? "Ask for their target: role, and ideally 2–5 target companies (a CV helps). Then run find_hiring_paths."
        : "Their network isn't synced yet: tell them to open the Hireco extension in Chrome and press Sync now, then come back.",
      "Mention results come as a downloadable CSV and a visual map, and that they have premium enrichment for up to " +
        `${status.premium_enrichment.total} prospects to get exact titles and work history.`,
      "Suggest prompts: 'Who can get me hired as <role> at <company>?', 'Who do I know at <company>?', 'Which ex-coworkers are now managers?'",
    ],
  };
}
