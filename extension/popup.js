import { SERVER } from "./config.js";

const $ = (id) => document.getElementById(id);
const open = (path) => (e) => { e.preventDefault(); chrome.tabs.create({ url: SERVER + path }); };

function line(text, { bold = false, muted } = {}) {
  const div = document.createElement("div");
  const main = document.createElement(bold ? "b" : "span");
  main.textContent = text;
  div.append(main);
  if (muted) {
    const m = document.createElement("span");
    m.className = "muted";
    m.textContent = ` ${muted}`;
    div.append(m);
  }
  return div;
}

async function checkKey(apiKey) {
  const res = await fetch(`${SERVER}/api/ext/status`, { headers: { authorization: `Bearer ${apiKey}` } });
  return res.ok ? res.json() : null;
}

async function render() {
  const s = await chrome.storage.local.get(null);
  $("error").textContent = s.lastError || "";
  const st = s.apiKey ? await checkKey(s.apiKey).catch(() => null) : null;

  $("setup").hidden = !!st;
  $("main").hidden = !st;
  if (!st) {
    if (s.apiKey) $("error").textContent = "That API key isn't valid. Generate a new one on the dashboard.";
    return;
  }

  $("hello").textContent = `Hello${st.linkedin_account?.name ? `, ${st.linkedin_account.name.split(" ")[0]}` : ""} 👋`;
  $("email").textContent = st.email || "";
  $("progress").textContent = s.progress || "";
  $("sync").disabled = !!s.syncing;
  $("sync").textContent = s.syncing ? "Syncing…" : "Sync now";
  $("pause").textContent = s.enrichPaused ? "Resume enrich" : "Pause enrich";
  $("step-sync").style.textDecoration = st.connections ? "line-through" : "";

  const todayCount = s.enrichDay === new Date().toISOString().slice(0, 10) ? s.enrichCount || 0 : 0;
  $("stats").replaceChildren(
    line(st.linkedin_account ? `LinkedIn: ${st.linkedin_account.name}` : "LinkedIn not synced yet", { bold: true }),
    line(`${st.connections.toLocaleString()} connections`),
    line(`${st.enriched_with_work_history.toLocaleString()} with work history`, { muted: `(${todayCount} today)` }),
  );
}

$("save").onclick = async () => {
  const apiKey = $("apiKey").value.trim();
  $("save").disabled = true;
  const ok = await checkKey(apiKey).catch(() => null);
  $("save").disabled = false;
  if (!ok) return void ($("error").textContent = "That API key isn't valid. Copy it again from the dashboard.");
  await chrome.storage.local.set({ apiKey, lastError: null });
};
$("change").onclick = () => chrome.storage.local.remove("apiKey");
$("dash").onclick = open("/dashboard");
$("guide").onclick = open("/guide");
$("sync").onclick = () => chrome.runtime.sendMessage({ type: "sync" });
$("pause").onclick = async () => {
  const { enrichPaused } = await chrome.storage.local.get("enrichPaused");
  await chrome.storage.local.set({ enrichPaused: !enrichPaused, resumeAt: null });
};
chrome.storage.onChanged.addListener(() => render());
render();
