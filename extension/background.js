import { closeIdleTab, connectionsPage, fullProfile, jitter, myPublicId } from "./linkedin.js";

// Pacing: keep traffic close to a person browsing LinkedIn.
const ENRICH_EVERY_MIN = 2;
const ENRICH_BATCH = 4;
const ENRICH_DAILY_CAP = 300;
const MAX_CONNECTIONS = 30000;

const getState = () => chrome.storage.local.get(null);
const setState = (patch) => chrome.storage.local.set(patch);
const today = () => new Date().toISOString().slice(0, 10);

async function api(path, init = {}) {
  const { server, apiKey } = await getState();
  if (!server || !apiKey) throw new Error("Set your Hireco server URL and API key first.");
  const res = await fetch(server.replace(/\/$/, "") + path, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}`, ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Hireco server returned ${res.status}`);
  return body;
}
const post = (path, data) => api(path, { method: "POST", body: JSON.stringify(data) });

let syncing = false;

async function syncConnections() {
  if (syncing) return;
  syncing = true;
  await setState({ syncing: true, progress: "Reading your profile…", lastError: null });
  let runId;
  try {
    const me = await fullProfile(await myPublicId());
    await post("/api/ext/me", me);

    let total = 0;
    for (let start = 0; start < MAX_CONNECTIONS; start += 40) {
      const page = await connectionsPage(start);
      if (!page.length) break;
      const res = await post("/api/ext/connections", { run_id: runId, connections: page });
      runId = res.run_id;
      total += page.length;
      await setState({ progress: `Synced ${total} connections…` });
      await jitter(1500, 3500);
    }
    if (runId) await post("/api/ext/connections", { run_id: runId, done: true });
    await setState({ progress: `Done — ${total} connections synced.`, lastSync: Date.now() });
  } catch (e) {
    await setState({ lastError: e.message, progress: null });
    if (runId) await post("/api/ext/connections", { run_id: runId, error: e.message }).catch(() => {});
  } finally {
    syncing = false;
    await setState({ syncing: false });
  }
}

let enriching = false;

async function enrichTick() {
  const s = await getState();
  if (enriching || syncing || !s.apiKey || s.enrichPaused) return;
  const used = s.enrichDay === today() ? s.enrichCount || 0 : 0;
  if (used >= ENRICH_DAILY_CAP) return;

  enriching = true;
  try {
    const { public_ids } = await api(`/api/ext/enrich-queue?limit=${Math.min(ENRICH_BATCH, ENRICH_DAILY_CAP - used)}`);
    if (!public_ids.length) return;
    const profiles = [];
    for (const id of public_ids) {
      try {
        profiles.push(await fullProfile(id));
      } catch (e) {
        if (/rate limit|signed in/i.test(e.message)) throw e;
        profiles.push({ public_id: id, error: e.message });
      }
      await jitter(4000, 9000);
    }
    await post("/api/ext/profiles", { profiles });
    await setState({ enrichDay: today(), enrichCount: used + profiles.length, lastError: null });
  } catch (e) {
    await setState({ lastError: e.message });
    // Back off for an hour on rate limits.
    if (/rate limit/i.test(e.message)) await setState({ enrichPaused: true, resumeAt: Date.now() + 3600_000 });
  } finally {
    enriching = false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("enrich", { periodInMinutes: ENRICH_EVERY_MIN });
  chrome.alarms.create("daily-sync", { periodInMinutes: 24 * 60 });
});

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  const s = await getState();
  if (s.enrichPaused && s.resumeAt && Date.now() > s.resumeAt) await setState({ enrichPaused: false, resumeAt: null });
  if (name === "enrich") await enrichTick();
  if (name === "daily-sync" && s.apiKey) await syncConnections();
  await closeIdleTab();
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === "sync") syncConnections();
  if (msg.type === "enrich-now") enrichTick();
  if (msg.type === "status") api("/api/ext/status").then(reply, (e) => reply({ error: e.message }));
  return msg.type === "status";
});
