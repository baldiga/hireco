import { SERVER, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";
import { closeIdleTab, connectionsAtCompany, connectionsPage, fullProfile, jitter, myPublicId, resolveCompanyId } from "./linkedin.js";

const MAX_CONNECTIONS = 30000;
// LinkedIn pages hold 40 connections; upload them in larger batches to save server calls.
const UPLOAD_BATCH = 520;

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

// Job polling goes straight to Supabase functions that check the Hireco key.
async function rpc(fn, args) {
  const { apiKey } = await getState();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ p_key: apiKey, ...args }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.message || `Hireco jobs returned ${res.status}`);
  return body;
}

// ---- Sync: your profile + all 1st-degree connections ----

let syncing = false;

async function syncConnections({ auto = false } = {}) {
  if (syncing) return;
  syncing = true;
  await setState({ syncing: true, progress: auto ? null : "Checking…", lastError: null, notice: null });
  let runId;
  try {
    const check = await post("/api/ext/connections", { check: true, auto });
    if (check.skip) {
      if (!auto) await setState({ notice: check.message, progress: null });
      return;
    }
    await setState({ progress: "Reading your profile…" });
    await post("/api/ext/me", await fullProfile(await myPublicId()));

    let total = 0;
    let batch = [];
    const upload = async (done) => {
      const res = await post("/api/ext/connections", { run_id: runId, connections: batch, ...(done ? { done: true } : {}) });
      runId = res.run_id;
      batch = [];
    };
    for (let start = 0; start < MAX_CONNECTIONS; start += 40) {
      const page = await connectionsPage(start);
      if (!page.length) break;
      batch.push(...page);
      total += page.length;
      if (batch.length >= UPLOAD_BATCH) await upload(false);
      await setState({ progress: `Synced ${total.toLocaleString()} connections…` });
      await jitter(1500, 3500);
    }
    if (batch.length || runId) await upload(true);
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
      const jobs = await rpc("ext_claim_jobs", {});
      if (!jobs.length) break;
      for (const job of jobs) {
        try {
          await setState({ progress: `Searching ${job.company_name} (${job.relation})…` });
          const company = job.company_id ? { id: job.company_id, name: job.company_name } : await resolveCompanyId(job.company_name);
          const public_ids = await connectionsAtCompany(company.id, job.relation);
          await rpc("ext_finish_job", { p_id: job.id, p_company_id: company.id, p_public_ids: public_ids });
        } catch (e) {
          await rpc("ext_finish_job", { p_id: job.id, p_error: e.message });
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
  if (name === "daily-sync" && s.apiKey) await syncConnections({ auto: true });
  await closeIdleTab();
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type === "sync") syncConnections();
  if (msg.type === "status") api("/api/ext/status").then(reply, (e) => reply({ error: e.message }));
  return msg.type === "status";
});
