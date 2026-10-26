import { SERVER } from "./config.js";
import { closeIdleTab, connectionsAtCompany, connectionsPage, fullProfile, jitter, myPublicId, resolveCompanyId } from "./linkedin.js";

const MAX_CONNECTIONS = 30000;

const getState = () => chrome.storage.local.get(null);
const setState = (patch) => chrome.storage.local.set(patch);

async function api(path, init = {}) {
  const { apiKey } = await getState();
  if (!apiKey) throw new Error("Paste your Hireco API key first.");
  const res = await fetch(SERVER + path, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}`, ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Hireco server returned ${res.status}`);
  return body;
}
const post = (path, data) => api(path, { method: "POST", body: JSON.stringify(data) });

// ---- Sync: your profile + all 1st-degree connections ----

let syncing = false;

async function syncConnections() {
  if (syncing) return;
  syncing = true;
  await setState({ syncing: true, progress: "Reading your profile…", lastError: null });
  let runId;
  try {
    await post("/api/ext/me", await fullProfile(await myPublicId()));

    let total = 0;
    for (let start = 0; start < MAX_CONNECTIONS; start += 40) {
      const page = await connectionsPage(start);
      if (!page.length) break;
      const res = await post("/api/ext/connections", { run_id: runId, connections: page });
      runId = res.run_id;
      total += page.length;
      await setState({ progress: `Synced ${total.toLocaleString()} connections…` });
      await jitter(1500, 3500);
    }
    if (runId) await post("/api/ext/connections", { run_id: runId, done: true });
    await setState({ progress: `Done — ${total.toLocaleString()} connections synced.`, lastSync: Date.now() });
  } catch (e) {
    await setState({ lastError: e.message, progress: null });
    if (runId) await post("/api/ext/connections", { run_id: runId, error: e.message }).catch(() => {});
  } finally {
    syncing = false;
    await setState({ syncing: false });
  }
}

// ---- Company searches requested by your AI agent ----

let runningJobs = false;

async function runJobs() {
  const s = await getState();
  if (runningJobs || !s.apiKey) return;
  runningJobs = true;
  try {
    for (;;) {
      const { jobs } = await api("/api/ext/jobs");
      if (!jobs.length) break;
      for (const job of jobs) {
        try {
          await setState({ progress: `Searching ${job.company_name} (${job.relation})…` });
          const company = job.company_id ? { id: job.company_id, name: job.company_name } : await resolveCompanyId(job.company_name);
          const public_ids = await connectionsAtCompany(company.id, job.relation);
          await post("/api/ext/jobs", { id: job.id, company_id: company.id, public_ids });
        } catch (e) {
          await post("/api/ext/jobs", { id: job.id, error: e.message });
          if (/rate limit|signed in/i.test(e.message)) throw e;
        }
        await jitter(2000, 4000);
      }
    }
    await setState({ progress: null });
  } catch (e) {
    await setState({ lastError: e.message, progress: null });
  } finally {
    runningJobs = false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.clearAll();
  chrome.alarms.create("jobs", { periodInMinutes: 0.5 });
  chrome.alarms.create("daily-sync", { periodInMinutes: 24 * 60 });
});

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  const s = await getState();
  if (name === "jobs") await runJobs();
  if (name === "daily-sync" && s.apiKey) await syncConnections();
  await closeIdleTab();
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === "sync") syncConnections();
  if (msg.type === "status") api("/api/ext/status").then(reply, (e) => reply({ error: e.message }));
  return msg.type === "status";
});
