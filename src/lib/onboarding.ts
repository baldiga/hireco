// Content Claude uses to introduce Hireco to a new user.

export const MAP_ARTIFACT_SPEC = `Build an interactive "Hireco map" artifact (single HTML page):
- The user in the center; target companies as hub nodes around them; each person a node linked to their company (or to the user if no target company).
- Color nodes by bucket: hiring_managers, decision_makers, insiders, recruiters, introducers, ex_coworkers. Include a legend.
- Clicking a node shows a side card: name, title @ company, why they matter, LinkedIn link, and a "Draft intro" suggestion.
- Under the map, a ranked "Best paths" list (top 5) with one line of reasoning each.
Keep it clean and readable on mobile.`;

export const DEMO_NETWORK = {
  me: { name: "Dana (you)", headline: "Senior Growth Manager", past_companies: ["Wix", "Fiverr"] },
  target: { role: "Head of Growth", companies: ["Stripe", "Monday.com"] },
  buckets: {
    hiring_managers: [{ name: "Noa Levi", title: "VP Growth", company: "Monday.com", why: "Runs growth at a target company — the likely hiring manager" }],
    decision_makers: [{ name: "Avi Cohen", title: "CMO", company: "Stripe", why: "C-level in your function at a target company" }],
    insiders: [{ name: "Maya Katz", title: "Product Designer", company: "Stripe", why: "Works at Stripe — can refer you internally" }],
    recruiters: [{ name: "Tom Ben-David", title: "Senior Talent Partner", company: "Monday.com", why: "Recruits for target company" }],
    introducers: [{ name: "Lior Mizrahi", title: "Founder", company: "Seed startup", why: "Previously at Stripe for 4 years — knows the growth team" }],
    ex_coworkers: [{ name: "Shira Adler", title: "Growth Lead", company: "Monday.com", why: "Both at Wix, ~2 years overlap — a warm referral into Monday.com" }],
  },
  best_paths: [
    "Shira Adler (ex-coworker, now at Monday.com) → intro to Noa Levi (VP Growth)",
    "Lior Mizrahi (ex-Stripe) → intro to Avi Cohen (CMO, Stripe)",
    "Tom Ben-David (recruiter, Monday.com) → direct application with a referral note",
  ],
};

export function welcome(status: { connections: number; enriched_with_work_history: number }) {
  const ready = status.connections > 0;
  return {
    what_hireco_does:
      "Hireco maps the user's own LinkedIn network to find who can get them hired: hiring managers, decision makers, insiders at target companies, recruiters, introducers (people who used to work at target companies) and ex-coworkers.",
    user_data: ready
      ? `${status.connections} connections synced, ${status.enriched_with_work_history} with full work history.`
      : "No connections synced yet. The user should open the Hireco Chrome extension and press Sync now.",
    how_to_present_this_to_the_user: [
      "Greet the user and explain Hireco in 2-3 sentences.",
      "Show what it can do by building the example Hireco map artifact from demo_network below — say clearly it's sample data.",
      ready
        ? "Then ask for their CV (or target role, seniority, companies, location) and offer to build the same map from their real network with find_hiring_paths."
        : "Then explain how to sync (extension → Sync now) and that they can come back once it's done.",
      "Suggest 3 example questions: 'Who can refer me into <company>?', 'Which ex-coworkers are now hiring managers?', 'Draft an intro message to <person>'.",
    ],
    demo_network: DEMO_NETWORK,
    map_artifact_spec: MAP_ARTIFACT_SPEC,
  };
}
