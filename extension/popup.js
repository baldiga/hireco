import { SERVER } from "./config.js";

const $ = (id) => document.getElementById(id);
const open = (path) => (e) => { e.preventDefault(); chrome.tabs.create({ url: SERVER + path }); };

async function checkKey(apiKey) {
  const res = await fetch(`${SERVER}/api/ext/status`, { headers: { authorization: `Bearer ${apiKey}` } });
  return res.ok ? res.json() : null;
}

// The server is asked only when the popup opens, the key changes or a sync finishes,
// not on every progress update.
let st = null;
let seen = { apiKey: undefined, syncing: false };

async function render() {
  const s = await chrome.storage.local.get(null);
  $("error").textContent = s.lastError || "";
  const refresh = s.apiKey !== seen.apiKey || (seen.syncing && !s.syncing);
  seen = { apiKey: s.apiKey, syncing: !!s.syncing };
  if (refresh) st = s.apiKey ? await checkKey(s.apiKey).catch(() => null) : null;

  $("setup").hidden = !!st;
  $("main").hidden = !st;
  if (!st) {
    if (s.apiKey) $("error").textContent = "That API key isn't valid. Generate a new one on the dashboard.";
    return;
  }

  const first = st.linkedin_account?.name?.split(" ")[0];
  $("hello").textContent = first ? `Hello, ${first}` : "Hello";
  $("email").textContent = st.email || "";
  $("conns").textContent = st.connections.toLocaleString();
  const house = st.premium_enrichment.mode !== "agent";
  $("quota").textContent = house ? `${st.premium_enrichment.remaining}` : (st.enriched_count ?? 0).toLocaleString();
  $("quota-lbl").textContent = house ? "premium prospects left" : "people enriched";
  $("progress").textContent = s.progress || s.notice || "";
  $("sync").disabled = !!s.syncing;
  $("sync").textContent = s.syncing ? "Syncing…" : st.connections ? "Sync again" : "Sync now";
  $("s1").classList.toggle("done", st.connections > 0);
  $("s2").classList.toggle("done", !!s.claudeConnected);
  if (refresh && st.connections > 0) renderMaps(s.apiKey);
}

// ---- My maps (kept for 14 days) ----

let showAll = false;
const DAY = 86400_000;
const ago = (iso) => {
  const d = Math.floor((Date.now() - Date.parse(iso)) / DAY);
  if (d >= 1) return d === 1 ? "yesterday" : `${d} days ago`;
  const h = Math.floor((Date.now() - Date.parse(iso)) / 3600_000);
  return h >= 1 ? `${h}h ago` : "just now";
};

function mapItem(m) {
  const li = document.createElement("li");
  li.className = "map-item";
  li.title = "Open map";
  li.onclick = () => chrome.tabs.create({ url: m.map_url });

  const title = document.createElement("span");
  title.className = "map-title";
  title.textContent = m.title;

  const left = Math.max(0, Math.ceil((Date.parse(m.expires_at) - Date.now()) / DAY));
  const meta = document.createElement("span");
  meta.className = "map-meta";
  meta.append(`${m.people != null ? `${m.people} people · ` : ""}${ago(m.created_at)} · `);
  const exp = document.createElement("span");
  if (left <= 3) exp.className = "soon";
  exp.textContent = left <= 1 ? "expires today" : `${left} days left`;
  meta.append(exp);

  const csv = document.createElement("a");
  csv.className = "map-csv";
  csv.href = m.csv_url;
  csv.textContent = "CSV";
  csv.onclick = (e) => { e.preventDefault(); e.stopPropagation(); chrome.tabs.create({ url: m.csv_url }); };

  li.append(title, csv, meta);
  return li;
}

async function renderMaps(apiKey) {
  const res = await fetch(`${SERVER}/api/ext/maps`, { headers: { authorization: `Bearer ${apiKey}` } }).catch(() => null);
  if (!res?.ok) return;
  const { maps, retention_days } = await res.json();
  $("maps").hidden = false;
  $("maps-note").textContent = `kept ${retention_days} days`;
  $("steps").hidden = maps.length > 0;

  const list = $("map-list");
  if (!maps.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.append("Your maps will appear here. Ask Claude: ");
    const i = document.createElement("i");
    i.textContent = "“Who can get me hired as … at …?”";
    empty.append(i);
    list.replaceChildren(empty);
    $("maps-more").hidden = true;
    return;
  }
  const shown = showAll ? maps : maps.slice(0, 4);
  list.replaceChildren(...shown.map(mapItem));
  $("maps-more").hidden = maps.length <= 4;
  $("maps-more").textContent = showAll ? "Show fewer" : `Show all ${maps.length}`;
}

$("maps-more").onclick = async () => {
  showAll = !showAll;
  const { apiKey } = await chrome.storage.local.get("apiKey");
  renderMaps(apiKey);
};

$("save").onclick = async () => {
  const apiKey = $("apiKey").value.trim();
  $("save").disabled = true;
  const ok = await checkKey(apiKey).catch(() => null);
  $("save").disabled = false;
  if (!ok) return void ($("error").textContent = "That API key isn't valid. Copy it again from the dashboard.");
  await chrome.storage.local.set({ apiKey, lastError: null });
};
$("change").onclick = (e) => { e.preventDefault(); chrome.storage.local.remove("apiKey"); };
$("dash").onclick = open("/dashboard");
$("howto").onclick = async (e) => { await chrome.storage.local.set({ claudeConnected: true }); open("/dashboard#connect")(e); };
$("guide").onclick = open("/guide");
$("sync").onclick = () => chrome.runtime.sendMessage({ type: "sync" });
chrome.storage.onChanged.addListener(() => render());
render();
