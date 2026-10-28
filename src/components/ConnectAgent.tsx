"use client";

import { useState, type ReactNode } from "react";
import CopyBlock from "./CopyBlock";

type Agent = { id: string; label: string; steps: ReactNode[]; blocks: { label?: string; text: string }[]; note?: ReactNode };

const B = ({ children }: { children: ReactNode }) => <b className="font-normal text-white">{children}</b>;
const C = ({ children }: { children: ReactNode }) => <span className="code rounded bg-black/30 px-1.5 py-0.5 text-ice">{children}</span>;

function agents(url: string, key: string): Agent[] {
  const auth = `Bearer ${key}`;
  const json = (o: unknown) => JSON.stringify(o, null, 2);
  return [
    {
      id: "claude-code",
      label: "Claude Code (recommended)",
      steps: [
        <>Open a terminal and start Claude Code with <C>claude</C>.</>,
        <>Paste these two lines, one after the other.</>,
        <>When it asks for your <B>Hireco API key</B>, paste it. It&apos;s kept in your system&apos;s secure keychain.</>,
        <>Type <C>/hireco:get-started</C> to try it.</>,
      ],
      blocks: [
        { label: "Plugin · includes the job-hunt skill", text: "/plugin marketplace add https://github.com/baldiga/hireco-plugin.git\n/plugin install hireco@hireco" },
        { label: "Or the MCP server only, from your terminal", text: `claude mcp add --transport http hireco ${url} --header "Authorization: ${auth}"` },
      ],
    },
    {
      id: "claude-desktop",
      label: "Claude Desktop app",
      steps: [
        <>Install <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-ice underline decoration-white/20 underline-offset-4">Node.js</a> (the LTS version) if you don&apos;t have it. Claude uses it to reach Hireco.</>,
        <>In Claude Desktop open <B>Settings → Developer → Edit Config</B>. This opens <C>claude_desktop_config.json</C>.</>,
        <>Paste the config below and save. If the file already has an <C>mcpServers</C> section, add just the <C>hireco</C> part inside it.</>,
        <>Quit Claude completely (from the tray / menu bar, not just the window) and open it again. Hireco appears in the tools menu of the chat box. The first start can take up to a minute.</>,
      ],
      blocks: [
        {
          text: json({
            mcpServers: {
              hireco: {
                command: "npx",
                args: ["-y", "mcp-remote", url, "--header", "Authorization:${HIRECO_AUTH}"],
                env: { HIRECO_AUTH: auth },
              },
            },
          }),
        },
      ],
    },
    {
      id: "cursor",
      label: "Cursor",
      steps: [
        <>Open <B>Cursor Settings → Tools &amp; MCP → New MCP Server</B>. This opens <C>~/.cursor/mcp.json</C>.</>,
        <>Paste the config below (or add the <C>hireco</C> part to your existing <C>mcpServers</C>) and save.</>,
        <>Back in settings, make sure the Hireco switch is on. Then ask in the Agent chat.</>,
      ],
      blocks: [{ text: json({ mcpServers: { hireco: { url, headers: { Authorization: auth } } } }) }],
    },
    {
      id: "codex",
      label: "Codex (OpenAI)",
      steps: [
        <>Open <C>~/.codex/config.toml</C> in any text editor (create it if it doesn&apos;t exist).</>,
        <>Paste these lines at the end and save.</>,
        <>Start <C>codex</C> again and type <C>/mcp</C>. Hireco should be listed.</>,
      ],
      blocks: [{ text: `[mcp_servers.hireco]\nurl = "${url}"\nhttp_headers = { Authorization = "${auth}" }` }],
    },
    {
      id: "vscode",
      label: "VS Code (GitHub Copilot)",
      steps: [
        <>Open the Command Palette (<C>Ctrl/Cmd + Shift + P</C>) and run <B>MCP: Open User Configuration</B>.</>,
        <>Paste the config below (or add the <C>hireco</C> part to your existing <C>servers</C>) and save.</>,
        <>Click <B>Start</B> above the Hireco entry, then ask in Copilot Chat in <B>Agent</B> mode.</>,
      ],
      blocks: [{ text: json({ servers: { hireco: { type: "http", url, headers: { Authorization: auth } } } }) }],
    },
    {
      id: "other",
      label: "Another MCP client",
      steps: [
        <>Hireco is a standard remote MCP server (Streamable HTTP). Add it in your client&apos;s MCP settings with this URL and header.</>,
      ],
      blocks: [
        { label: "Server URL", text: url },
        { label: "Header", text: `Authorization: ${auth}` },
      ],
    },
    {
      id: "claude-web",
      label: "Claude.ai in the browser",
      steps: [],
      blocks: [],
      note: (
        <>
          Not yet. Custom connectors on claude.ai need a sign-in flow that Hireco doesn&apos;t support yet. Until then, use the{" "}
          <B>Claude Desktop app</B> or <B>Claude Code</B>. Both use the same Claude account.
        </>
      ),
    },
  ];
}

export default function ConnectAgent({ url, apiKey }: { url: string; apiKey?: string | null }) {
  const list = agents(url, apiKey || "hk_YOUR_KEY");
  const [id, setId] = useState(list[0].id);
  const agent = list.find((a) => a.id === id) ?? list[0];

  return (
    <div>
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-mist">Your AI</span>
        <span className="relative block">
          <select value={id} onChange={(e) => setId(e.target.value)} className="field w-full cursor-pointer appearance-none pr-11">
            {list.map((a) => <option key={a.id} value={a.id} className="bg-[#0a1433]">{a.label}</option>)}
          </select>
          <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ice">
            <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </label>

      {agent.note && <p className="mt-5 rounded-2xl border border-champagne/25 bg-champagne/[0.06] p-4 text-sm leading-relaxed text-frost">{agent.note}</p>}
      {agent.steps.length > 0 && (
        <ol className="mt-5 space-y-2.5 text-sm leading-relaxed text-frost">
          {agent.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-display mt-[-2px] w-5 shrink-0 text-lg text-ice/60">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
      {agent.blocks.length > 0 && (
        <div className="mt-5 grid gap-4">{agent.blocks.map((b) => <CopyBlock key={b.text} label={b.label} text={b.text} />)}</div>
      )}
      {!apiKey && agent.blocks.length > 0 && (
        <p className="mt-3 text-xs text-mist">Replace <span className="code">hk_YOUR_KEY</span> with your Hireco API key.</p>
      )}
    </div>
  );
}
