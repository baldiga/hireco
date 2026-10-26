import type { BucketType, MapPerson, MapSpec } from "./mapSpec";

// A real Hireco result with every person and company replaced by fictional ones.
const people: MapPerson[] = [];
const P = (id: string, name: string, title: string, company: string, bucket: BucketType, why: string) =>
  people.push({ id, name, title, company, bucket, why });

P("avi", "Ari Lavon", "VP Agentic GTM", "Lumora", "decision_maker", "Headline covers GTM engineering, growth, RevOps and automation — the exact role you want.");
P("oren", "Oren Adler", "VP Agentic GTM", "Orbitly", "decision_maker", "Senior owner of agentic GTM. A GTM engineer hire would sit in or near this group.");
P("mika", "Mika Hollander", "Head of AI GTM", "Orbitly", "hiring_manager", "Leads AI in go-to-market — the closest match to a GTM engineer seat here.");
P("ophir", "Omer Peled", "VP of GTM", "Orbitly", "decision_maker", "VP over GTM. A useful sponsor once you've spoken to the AI GTM leads.");
P("gil", "Gil Harel", "GTM Ops & Strategy Lead", "Orbitly", "hiring_manager", "Leads GTM ops and talks about making ops AI-native. A peer-level door into the team.");
P("yael", "Yarden Kessler", "Marketing Ops Manager", "Orbitly", "ex_coworker", "You worked together for two years. Ask how ops works with the AI GTM group and who's hiring.");
P("shir", "Shira Gold", "Head of GTM Operations", "Tessaro", "hiring_manager", "Heads GTM operations and describes herself as a RevOps leader. Owns the function.");
P("galr", "Gal Rosen", "Head of GTM Applications", "Tessaro", "hiring_manager", "Heads GTM applications — the systems and tooling side of GTM.");
P("esti", "Esther Sharon", "GTM Operations Lead", "Tessaro", "insider", "Leads GTM operations inside Tessaro. A warm way in to Shira and Gal.");
P("dan", "Daniel Navon", "Head of GTM, Creative", "Tessaro", "insider", "Sits inside the GTM org and can point you to the right team.");
P("tom", "Tom Halevi", "RevOps Lead", "Quillon", "hiring_manager", "RevOps lead whose headline covers GTM engineering, revenue systems and automation.");
P("igal", "Ido Oz", "Head of Growth & GTME", "Brightfold", "hiring_manager", "GTME means GTM engineering — he leads the function you want to join.");
P("dotan", "Dor Zamir", "Head of Revenue Operations", "Halvard", "hiring_manager", "Head of RevOps who says he's building the GTM engine. A direct hiring-manager match.");
P("david", "David Lerner", "GTM Engineer", "Driftwise", "introducer", "Already a GTM Engineer here. Ask how the role is scoped and whether the team is growing.");
P("saar", "Saar Hadad", "GTM Engineer", "Driftwise", "insider", "A second GTM Engineer at the same company, so it's a real team. Good for a referral.");
P("hila", "Hila Kaplan", "Head Hunter, GTM", "Talentwise", "recruiter", "Specializes in GTM recruiting in Israel and abroad.");
P("keren", "Keren Shalev", "GTM Headhunter", "Independent", "recruiter", "Freelance talent partner for tech and GTM roles.");
P("vera", "Vera Nordin", "Head of Recruitment", "OnPoint GTM", "recruiter", "Recruits GTM teams for startups and scaleups worldwide.");
P("noemie", "Noa Jacobs", "GTM Engineering Recruiter", "Independent", "recruiter", "Places GTM engineers at AI-native companies in San Francisco, New York and London.");
P("nadav", "Nadav Brill", "Director of RevOps", "Kestrel", "hiring_manager", "Runs revenue operations — a likely owner of a RevOps hire.");
P("raz", "Raz Rubin", "Director of Analytics & RevOps", "Pixelane", "hiring_manager", "Runs analytics and RevOps — a likely owner of a RevOps hire.");
P("maya", "Maya Haddad", "Director of RevOps", "Paywise", "hiring_manager", "Runs revenue operations — a likely owner of a RevOps hire.");
P("matan", "Matan Raviv", "Head of RevOps", "Castwave", "hiring_manager", "Runs revenue operations — a likely owner of a RevOps hire.");
P("assaf", "Asaf Amir", "VP Global RevOps", "Fortline", "decision_maker", "VP over global revenue operations at a large company.");
P("barak", "Barak Vered", "Head of GTM & BizOps", "Gripfield", "hiring_manager", "Heads GTM and business operations — a likely owner of a GTM engineer hire.");
P("galo", "Gali Ofer", "Director of GTM & AI Strategy", "Hypernova", "hiring_manager", "Directs GTM and AI strategy — a likely owner of a GTM engineer hire.");
P("elina", "Elena Petrov", "Head of GTM", "Altura", "hiring_manager", "Calls herself an AI-native GTM leader and operator.");
P("tal", "Tal Cohen", "Head of Growth", "Teamforge", "hiring_manager", "Says she's building AI-powered GTM systems.");
P("natalie", "Natalie Lev", "VP Revenue & GTM", "Privana", "decision_maker", "VP over revenue and GTM — a likely owner of a GTM engineer hire.");
P("itamar", "Itamar Dagan", "GTM Engineer", "Starline", "insider", "A GTM Engineer elsewhere. Can say whether the team is hiring and refer you.");
P("eyal", "Eyal Sasson", "GTM Engineer & MOps", "Frogwire", "ex_coworker", "You overlapped for a year. Can say whether the team is hiring and refer you.");
P("shlomo", "Shlomi Gat", "GTM Engineer", "Actuate", "insider", "A GTM Engineer elsewhere. Can say whether the team is hiring and refer you.");
P("idan", "Idan Segal", "AI GTM Engineer", "Settle", "insider", "An AI GTM Engineer. Can say whether the team is hiring and refer you.");
P("dana", "Dana Pinto", "GTM Engineer", "Koala", "insider", "A GTM Engineer elsewhere. Can say whether the team is hiring and refer you.");
P("artem", "Artem Kogan", "CEO, GTM Engineering as a Service", "Nexora", "other", "Runs a GTM-engineering shop — a source of contract work and team roles.");
P("roman", "Roman Bar", "Head of HubSpot & RevOps", "Sagewell", "other", "Heads RevOps at a HubSpot partner. An agency route for RevOps work.");

export const DEMO_MAP: MapSpec = {
  title: "Hiring path map",
  subtitle: "Routes through your LinkedIn network to a GTM engineer or RevOps role.",
  me: "Dana Rivlin",
  people: people.map((p) => ({ ...p, url: undefined })),
  stats: [
    { value: "8,053", label: "connections searched" },
    { value: String(people.length), label: "people mapped" },
    { value: "8", label: "places to start" },
  ],
  hubs: [
    { id: "lumora", label: "Lumora", start: true, people: ["avi"], steps: [["avi"]], note: "Direct route. Title, headline and focus all match the role." },
    { id: "orbitly", label: "Orbitly", start: true, people: ["yael", "gil", "mika", "oren", "ophir"], steps: [["yael"], ["gil", "mika"], ["oren"]],
      note: "Five contacts at one company, including an ex-coworker. Start with Yarden — she can introduce you to the AI GTM leads." },
    { id: "tessaro", label: "Tessaro", start: true, people: ["esti", "dan", "shir", "galr"], steps: [["esti"], ["shir", "galr"]],
      note: "Four contacts in GTM. The GTM operations lead is the warm door to the two heads." },
    { id: "quillon", label: "Quillon", start: true, people: ["tom"], steps: [["tom"]], note: "Direct route to a RevOps lead whose headline covers GTM engineering and automation." },
    { id: "brightfold", label: "Brightfold", start: true, people: ["igal"], steps: [["igal"]], note: "Direct route to the lead of a GTM engineering function." },
    { id: "halvard", label: "Halvard", start: true, people: ["dotan"], steps: [["dotan"]], note: "Direct route to a head of RevOps who is building the GTM engine." },
    { id: "driftwise", label: "Driftwise", start: true, people: ["david", "saar"], steps: [["david", "saar"]], note: "Two GTM Engineers at one company. Ask for a referral and how the role is scoped." },
    { id: "recruiters", label: "Recruiters", full: "GTM recruiters", start: true, people: ["hila", "keren", "vera", "noemie"], steps: [["hila", "keren", "vera", "noemie"]],
      note: "Four recruiters who place GTM people. Contact them in parallel." },
    { id: "revops", label: "RevOps heads", full: "RevOps heads and directors", start: false, people: ["nadav", "raz", "maya", "matan", "assaf"], note: "Each is a likely owner of a RevOps hire." },
    { id: "startups", label: "Startup leads", full: "Startup GTM leads", start: false, people: ["barak", "galo", "elina", "tal", "natalie"], note: "GTM leaders at startups, each a likely owner of a GTM engineer hire." },
    { id: "peers", label: "GTM peers", full: "GTM engineer peers", start: false, people: ["itamar", "eyal", "shlomo", "idan", "dana"], note: "GTM engineers elsewhere who can tell you whether their teams are hiring." },
    { id: "agencies", label: "Agencies", full: "Agency routes", start: false, people: ["artem", "roman"], note: "A route to contract work or a delivery-team role." },
  ],
};
