const $ = (id) => document.getElementById(id);

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

async function render() {
  const s = await chrome.storage.local.get(null);
  $("server").value = s.server || "";
  $("apiKey").value = s.apiKey || "";
  $("progress").textContent = s.progress || "";
  $("error").textContent = s.lastError || "";
  $("sync").disabled = !!s.syncing;
  $("sync").textContent = s.syncing ? "Syncing…" : "Sync now";
  $("pause").textContent = s.enrichPaused ? "Resume enrich" : "Pause enrich";

  const stats = $("stats");
  if (!s.apiKey) return void (stats.textContent = "Paste the server URL and API key from your Hireco dashboard.");
  const st = await chrome.runtime.sendMessage({ type: "status" });
  if (st.error) return void (stats.textContent = st.error);
  const todayCount = s.enrichDay === new Date().toISOString().slice(0, 10) ? s.enrichCount || 0 : 0;
  stats.replaceChildren(
    line(st.linkedin_account?.name ?? "LinkedIn not synced yet", { bold: true }),
    line(`${st.connections.toLocaleString()} connections`),
    line(`${st.enriched_with_work_history.toLocaleString()} with work history`, { muted: `(${todayCount} today)` }),
  );
}

$("save").onclick = async () => {
  await chrome.storage.local.set({ server: $("server").value.trim(), apiKey: $("apiKey").value.trim() });
  render();
};
$("sync").onclick = () => { chrome.runtime.sendMessage({ type: "sync" }); setTimeout(render, 500); };
$("pause").onclick = async () => {
  const { enrichPaused } = await chrome.storage.local.get("enrichPaused");
  await chrome.storage.local.set({ enrichPaused: !enrichPaused, resumeAt: null });
  render();
};
chrome.storage.onChanged.addListener(() => render());
render();
