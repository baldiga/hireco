import { SERVER } from "./config.js";

const $ = (id) => document.getElementById(id);
const open = (path) => (e) => { e.preventDefault(); chrome.tabs.create({ url: SERVER + path }); };

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

  const first = st.linkedin_account?.name?.split(" ")[0];
  $("hello").textContent = first ? `Hello, ${first}` : "Hello";
  $("email").textContent = st.email || "";
  $("conns").textContent = st.connections.toLocaleString();
  $("quota").textContent = `${st.premium_enrichment.remaining}`;
  $("progress").textContent = s.progress || "";
  $("sync").disabled = !!s.syncing;
  $("sync").textContent = s.syncing ? "Syncing…" : st.connections ? "Sync again" : "Sync now";
  $("s1").classList.toggle("done", st.connections > 0);
  $("s2").classList.toggle("done", !!s.claudeConnected);
}

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
