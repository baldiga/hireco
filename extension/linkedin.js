// Talks to LinkedIn's internal API (Voyager) from inside a linkedin.com tab,
// so requests use the member's own session exactly like the website does.

const ORIGIN = "https://www.linkedin.com";
const IDLE_CLOSE_MS = 3 * 60 * 1000;
let ownTabId = null;
let lastUsed = 0;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const jitter = (min, max) => sleep(min + Math.random() * (max - min));

async function linkedinTab() {
  const [existing] = await chrome.tabs.query({ url: `${ORIGIN}/*`, status: "complete" });
  if (existing) return existing.id;
  if (ownTabId !== null) {
    try { await chrome.tabs.get(ownTabId); return ownTabId; } catch { ownTabId = null; }
  }
  const tab = await chrome.tabs.create({ url: `${ORIGIN}/feed/`, active: false, pinned: true });
  ownTabId = tab.id;
  await new Promise((resolve) => {
    const onUpdated = (id, info) => {
      if (id === tab.id && info.status === "complete") { chrome.tabs.onUpdated.removeListener(onUpdated); resolve(); }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
  });
  return ownTabId;
}

/** Closes the background tab we opened once it has been idle for a while. */
export async function closeIdleTab() {
  if (ownTabId !== null && Date.now() - lastUsed > IDLE_CLOSE_MS) {
    try { await chrome.tabs.remove(ownTabId); } catch {}
    ownTabId = null;
  }
}

// Runs in the page. Must be self-contained.
async function pageFetch(path) {
  const csrf = (document.cookie.match(/JSESSIONID="?([^";]+)/) || [])[1];
  if (!csrf) return { status: 401, body: null };
  const res = await fetch(path, {
    headers: {
      "csrf-token": csrf,
      accept: "application/vnd.linkedin.normalized+json+2.1",
      "x-restli-protocol-version": "2.0.0",
    },
  });
  return { status: res.status, body: res.ok ? await res.json() : null };
}

export async function voyager(path) {
  lastUsed = Date.now();
  const tabId = await linkedinTab();
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func: pageFetch, args: [path] });
  lastUsed = Date.now();
  if (result.status === 401 || result.status === 403) throw new Error("Not signed in to LinkedIn in this browser.");
  if (result.status === 429) throw new Error("LinkedIn rate limit hit — pausing.");
  if (!result.body) throw new Error(`LinkedIn returned ${result.status}`);
  return result.body;
}

const byType = (included, suffix) => (included || []).filter((i) => i.$type?.endsWith(suffix));

function pictureUrl(pic) {
  const v = pic?.displayImageReference?.vectorImage;
  const art = v?.artifacts?.sort((a, b) => a.width - b.width).find((a) => a.width >= 100) || v?.artifacts?.[0];
  return v && art ? v.rootUrl + art.fileIdentifyingUrlPathSegment : undefined;
}

const ym = (d) => (d?.year ? { year: d.year, ...(d.month ? { month: d.month } : {}) } : undefined);

/** One page of the member's connections, newest first. */
export async function connectionsPage(start, count = 40) {
  const j = await voyager(
    `/voyager/api/relationships/dash/connections?decorationId=com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-16&count=${count}&q=search&sortType=RECENTLY_ADDED&start=${start}`,
  );
  const profiles = new Map(byType(j.included, ".Profile").map((p) => [p.entityUrn, p]));
  return byType(j.included, ".Connection")
    .map((c) => {
      const p = profiles.get(c.connectedMember);
      if (!p?.publicIdentifier) return null;
      return {
        public_id: p.publicIdentifier,
        urn: p.entityUrn,
        first_name: p.firstName,
        last_name: p.lastName,
        headline: p.headline,
        picture_url: pictureUrl(p.profilePicture),
        connected_at: c.createdAt ? new Date(c.createdAt).toISOString() : undefined,
      };
    })
    .filter(Boolean);
}

/** Full profile with work history and education. */
export async function fullProfile(publicId) {
  const j = await voyager(
    `/voyager/api/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeURIComponent(publicId)}&decorationId=com.linkedin.voyager.dash.deco.identity.profile.FullProfileWithEntities-93`,
  );
  const profile = byType(j.included, ".Profile").find((p) => p.publicIdentifier === publicId);
  if (!profile) throw new Error("profile not found");
  // Only keep entities that belong to this profile (urn looks like urn:li:fsd_position:(<profileId>,<n>)).
  const profileId = profile.entityUrn.split(":").pop();
  const mine = (i) => i.entityUrn?.includes(profileId);

  const positions = byType(j.included, ".Position").filter(mine).map((p) => ({
    title: p.title,
    company: p.companyName,
    companyUrn: p.companyUrn,
    start: ym(p.dateRange?.start),
    end: p.dateRange?.end ? ym(p.dateRange.end) : null,
    location: p.locationName || p.geoLocationName,
  }));
  positions.sort((a, b) => (b.start?.year ?? 0) * 12 + (b.start?.month ?? 0) - ((a.start?.year ?? 0) * 12 + (a.start?.month ?? 0)));

  const educations = byType(j.included, ".Education").filter(mine).map((e) => ({
    school: e.schoolName,
    degree: e.degreeName,
    field: e.fieldOfStudy,
    start: ym(e.dateRange?.start),
    end: ym(e.dateRange?.end),
  }));

  return {
    public_id: publicId,
    urn: profile.entityUrn,
    full_name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
    headline: profile.headline,
    location: profile.geoLocationName || profile.locationName,
    positions,
    educations,
  };
}

/** The signed-in member's public id. */
export async function myPublicId() {
  const j = await voyager("/voyager/api/me");
  const mini = (j.included || []).find((i) => i.publicIdentifier);
  if (!mini) throw new Error("Could not read your LinkedIn profile.");
  return mini.publicIdentifier;
}
