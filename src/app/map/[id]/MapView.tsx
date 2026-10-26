"use client";

import { useMemo, useState } from "react";

type Row = { bucket: string; name: string; title: string | null; company: string | null; url: string; why: string; enriched: boolean };

const BUCKETS: Record<string, { label: string; color: string }> = {
  ex_coworkers: { label: "Ex-coworkers", color: "#7fe3ff" },
  hiring_managers: { label: "Hiring managers", color: "#8fb0ff" },
  decision_makers: { label: "Decision makers", color: "#c7b8ff" },
  insiders: { label: "Insiders", color: "#9ff0d0" },
  introducers: { label: "Introducers", color: "#e7d6b0" },
  recruiters: { label: "Recruiters", color: "#ffb8c9" },
  search: { label: "Matches", color: "#8fb0ff" },
};
const W = 900, H = 620, CX = W / 2, CY = H / 2;
const PER_BUCKET = 18;

export default function MapView({ rows }: { rows: Row[] }) {
  const groups = useMemo(() => {
    const g = new Map<string, Row[]>();
    for (const r of rows) g.set(r.bucket, [...(g.get(r.bucket) ?? []), r]);
    return [...g.entries()].filter(([, v]) => v.length);
  }, [rows]);
  const [filter, setFilter] = useState<string | null>(null);
  const [active, setActive] = useState<Row | null>(null);

  // Lay each bucket out in its own sector, people on concentric arcs.
  const nodes = groups.flatMap(([bucket, people], gi) => {
    const span = (Math.PI * 2) / groups.length;
    const start = -Math.PI / 2 + gi * span;
    const shown = people.slice(0, PER_BUCKET);
    return shown.map((p, i) => {
      const ring = i % 3;
      const a = start + span * (0.14 + 0.72 * ((i + 0.5) / shown.length));
      const r = 150 + ring * 70;
      return { ...p, x: CX + Math.cos(a) * r * 1.25, y: CY + Math.sin(a) * r * 0.85, key: `${bucket}-${i}` };
    });
  });
  const labels = groups.map(([bucket, people], gi) => {
    const a = -Math.PI / 2 + (gi + 0.5) * ((Math.PI * 2) / groups.length);
    return { bucket, count: people.length, x: CX + Math.cos(a) * 330, y: CY + Math.sin(a) * 290 + 4 };
  });
  const visible = rows.filter((r) => !filter || r.bucket === filter);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Chip on={!filter} onClick={() => setFilter(null)} label={`All · ${rows.length}`} />
        {groups.map(([b, p]) => (
          <Chip key={b} on={filter === b} onClick={() => setFilter(filter === b ? null : b)} label={`${BUCKETS[b]?.label ?? b} · ${p.length}`} color={BUCKETS[b]?.color} />
        ))}
      </div>

      <div className="panel panel-hi relative mt-6 overflow-hidden p-2 sm:p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
          <defs>
            <radialGradient id="mcore"><stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#a8dcff" /><stop offset="1" stopColor="#2f5bea" /></radialGradient>
            <radialGradient id="mhalo"><stop offset="0" stopColor="#4f7dff" stopOpacity=".35" /><stop offset="1" stopColor="#4f7dff" stopOpacity="0" /></radialGradient>
          </defs>
          {[150, 220, 290].map((r) => <ellipse key={r} cx={CX} cy={CY} rx={r * 1.25} ry={r * 0.85} fill="none" stroke="rgba(185,205,255,.07)" />)}
          {nodes.map((n) => {
            const dim = filter && n.bucket !== filter;
            const c = BUCKETS[n.bucket]?.color ?? "#8fb0ff";
            return (
              <g key={n.key} opacity={dim ? 0.12 : 1} style={{ transition: "opacity .3s", cursor: "pointer" }} onMouseEnter={() => setActive(n)} onClick={() => setActive(n)}>
                <line x1={CX} y1={CY} x2={n.x} y2={n.y} stroke={c} strokeOpacity={active?.url === n.url ? 0.8 : 0.14} />
                <circle cx={n.x} cy={n.y} r={active?.url === n.url ? 9 : 6} fill={c} fillOpacity={n.enriched ? 1 : 0.55} stroke={c} strokeOpacity=".5" />
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r="80" fill="url(#mhalo)" />
          <circle cx={CX} cy={CY} r="14" fill="url(#mcore)" />
          <text x={CX} y={CY + 38} textAnchor="middle" fill="#fff" style={{ font: "italic 300 22px var(--font-display)" }}>you</text>
          {labels.map((l) => (
            <text key={l.bucket} x={l.x} y={l.y} textAnchor="middle" fill={BUCKETS[l.bucket]?.color ?? "#fff"} style={{ font: "400 13px var(--font-sans)", letterSpacing: ".12em" }}>
              {(BUCKETS[l.bucket]?.label ?? l.bucket).toUpperCase()} · {l.count}
            </text>
          ))}
        </svg>

        {active && (
          <div className="panel absolute bottom-4 left-4 right-4 max-w-sm bg-ink/80 p-5 sm:left-auto">
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: BUCKETS[active.bucket]?.color }}>{BUCKETS[active.bucket]?.label}</p>
            <p className="font-display mt-1 text-2xl text-white">{active.name}</p>
            <p className="text-sm text-frost">{[active.title, active.company].filter(Boolean).join(" · ")}</p>
            <p className="mt-2 text-sm text-mist">{active.why}</p>
            <a href={active.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-ice underline decoration-white/20 underline-offset-4">Open LinkedIn profile ↗</a>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-mist">Solid dots have verified work history (premium). The map shows up to {PER_BUCKET} people per group; the table and CSV have everyone.</p>

      <div className="panel mt-10 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.18em] text-mist">
            <tr>{["Path", "Name", "Role", "Why"].map((h) => <th key={h} className="px-5 py-4 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={`${r.url}-${r.bucket}-${i}`} className="border-t border-[var(--line)] hover:bg-white/[0.03]">
                <td className="px-5 py-3" style={{ color: BUCKETS[r.bucket]?.color }}>{BUCKETS[r.bucket]?.label ?? r.bucket}</td>
                <td className="px-5 py-3"><a href={r.url} target="_blank" rel="noreferrer" className="text-white hover:underline">{r.name}</a></td>
                <td className="px-5 py-3 text-frost">{[r.title, r.company].filter(Boolean).join(" · ")}</td>
                <td className="px-5 py-3 text-mist">{r.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Chip({ on, onClick, label, color }: { on: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${on ? "border-white/30 bg-white/10 text-white" : "border-[var(--line)] text-mist hover:text-frost"}`}>
      {color && <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: color }} />}
      {label}
    </button>
  );
}
