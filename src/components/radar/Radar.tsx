"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BUCKET_INFO, BUCKET_TYPES, hubMarks, initialsOf, type BucketType, type MapPerson, type MapSpec } from "@/lib/mapSpec";
import "./radar.css";

const NS = "http://www.w3.org/2000/svg";
type Target = { t: "h" | "p"; id: string } | null;
type Refs = { p: Record<string, { g: SVGGElement; edge: SVGLineElement; label: SVGTextElement | null }>; h: Record<string, { g: SVGGElement; spoke: SVGLineElement; label: SVGTextElement | null }> };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function mk<K extends keyof SVGElementTagNameMap>(tag: K, at: Record<string, string | number>, parent?: Element) {
  const e = document.createElementNS(NS, tag);
  for (const k in at) e.setAttribute(k, String(at[k]));
  parent?.appendChild(e);
  return e;
}
const trim = (a: number[], b: number[], d1: number, d2: number) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  return [a[0] + ux * d1, a[1] + uy * d1, b[0] - ux * d2, b[1] - uy * d2];
};
const roleLine = (p: MapPerson) => [p.title, p.company].filter(Boolean).join(" · ");
const cvar = (b: BucketType) => ({ "--c": `var(--${b})` }) as React.CSSProperties;

export default function Radar({ spec, maxSize = 860 }: { spec: MapSpec; maxSize?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Refs>({ p: {}, h: {} });
  const [drawn, setDrawn] = useState(0);
  const [sel, setSel] = useState<Target>(null);
  const [hov, setHov] = useState<Target>(null);
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [openPath, setOpenPath] = useState<{ hub: string; person: string } | null>(null);

  const P = useMemo(() => Object.fromEntries(spec.people.map((p) => [p.id, p])), [spec]);
  const hubs = useMemo(() => spec.hubs.map((h) => ({ ...h, people: h.people.filter((id) => P[id]) })).filter((h) => h.people.length), [spec, P]);
  const marks = useMemo(() => hubMarks(hubs), [hubs]);
  const hubOf = useMemo(() => Object.fromEntries(hubs.flatMap((h) => h.people.map((id) => [id, h.id]))), [hubs]);
  const HB = useMemo(() => Object.fromEntries(hubs.map((h, i) => [h.id, { ...h, mark: marks[i], i }])), [hubs, marks]);
  const tagOf = useMemo(() => {
    const first = (n: string) => n.split(" ")[0];
    const count: Record<string, number> = {};
    spec.people.forEach((p) => (count[first(p.name)] = (count[first(p.name)] ?? 0) + 1));
    return (p: MapPerson) => (count[first(p.name)] > 1 ? `${first(p.name)} ${p.name.split(" ").pop()?.[0] ?? ""}.` : first(p.name));
  }, [spec]);
  const present = BUCKET_TYPES.filter((b) => spec.people.some((p) => p.bucket === b && hubOf[p.id]));

  // ---- drawing (imperative SVG, sized to the container) ----
  const draw = useCallback(() => {
    const svg = svgRef.current, wrap = wrapRef.current;
    if (!svg || !wrap) return;
    const S = clamp(Math.floor(wrap.clientWidth), 280, maxSize);
    const cx = S / 2, cy = S / 2;
    const pol = (r: number, t: number) => [cx + r * Math.cos(t), cy + r * Math.sin(t)];
    const fs = S >= 700 ? 11 : 10, a = clamp(S * 0.0185, 8, 15), names = S >= 520, hubR = S >= 600 ? 12 : 10;
    const meR = S >= 640 ? 27 : S >= 520 ? 20 : 18;
    const room = names ? Math.ceil(fs * 0.58 * 8) + 6 : 2;
    const bez = S / 2 - 6, r2 = bez - 12 - a - 4 - room, r1 = r2 * 0.62, anchorR = r1 - hubR - 6;
    const maxChars = Math.max(...hubs.map((h) => h.label.length));
    const hubFs = Math.min(fs, Math.floor((anchorR - (meR + 8)) / (maxChars * 0.58)));
    const unit = (2 * a + 4) / r2, badge = (2 * hubR + 8) / r1, gap = rad(8);
    const need = hubs.map((h) => Math.max(h.people.length * unit, badge));
    const k = (2 * Math.PI - 2 * gap) / need.reduce((s, v) => s + v, 0);
    const firstOther = hubs.findIndex((h) => !h.start);
    let th = -Math.PI / 2 + gap / 2;
    const sec = hubs.map((_, i) => {
      if (i === firstOther && firstOther > 0) th += gap;
      const s0 = th;
      th += need[i] * k;
      return { a0: s0, a1: th, mid: (s0 + th) / 2 };
    });

    svg.setAttribute("width", String(S));
    svg.setAttribute("height", String(S));
    svg.setAttribute("viewBox", `0 0 ${S} ${S}`);
    svg.textContent = "";
    refs.current = { p: {}, h: {} };

    const R = bez - 4, W = rad(34);
    const defs = mk("defs", {}, svg);
    const lg = mk("linearGradient", { id: "hrSweep", gradientUnits: "userSpaceOnUse", x1: R * 0.92 * Math.cos(W), y1: -R * 0.92 * Math.sin(W), x2: R * 0.92, y2: 0 }, defs);
    mk("stop", { offset: 0, "stop-color": "#4f7dff", "stop-opacity": 0 }, lg);
    mk("stop", { offset: 1, "stop-color": "#7fe3ff", "stop-opacity": 0.2 }, lg);
    const bg = mk("linearGradient", { id: "hrBadge", x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    mk("stop", { offset: 0, "stop-color": "#5a85ff" }, bg);
    mk("stop", { offset: 1, "stop-color": "#1a3aa6" }, bg);
    const core = mk("radialGradient", { id: "hrCore" }, defs);
    mk("stop", { offset: 0, "stop-color": "#ffffff" }, core);
    mk("stop", { offset: 0.5, "stop-color": "#7aa8ff" }, core);
    mk("stop", { offset: 1, "stop-color": "#1a3aa6" }, core);
    const halo = mk("radialGradient", { id: "hrHalo" }, defs);
    mk("stop", { offset: 0, "stop-color": "#4f7dff", "stop-opacity": 0.35 }, halo);
    mk("stop", { offset: 1, "stop-color": "#4f7dff", "stop-opacity": 0 }, halo);

    mk("circle", { cx, cy, r: r1, class: "guide" }, svg);
    mk("circle", { cx, cy, r: r2, class: "guide" }, svg);
    mk("circle", { cx, cy, r: bez, class: "rim" }, svg);
    let d = "";
    for (let i = 0; i < 72; i++) {
      const t = rad(i * 5 - 90), len = i % 6 === 0 ? 8 : 4, p1 = pol(bez, t), p2 = pol(bez - len, t);
      d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    mk("path", { d, class: "tick" }, svg);
    const sw = mk("g", { transform: `translate(${cx} ${cy})`, "aria-hidden": "true" }, svg);
    const sweep = mk("g", { class: "sweep" }, sw);
    mk("path", { d: `M0 0L${R} 0A${R} ${R} 0 0 0 ${R * Math.cos(W)} ${-R * Math.sin(W)}Z`, fill: "url(#hrSweep)" }, sweep);

    const gE = mk("g", {}, svg), gH = mk("g", {}, svg), gP = mk("g", {}, svg), gL = mk("g", {}, svg), gM = mk("g", {}, svg);

    hubs.forEach((h, i) => {
      const s = sec[i], hp = pol(r1, s.mid), s0 = pol(meR + 6, s.mid), s1 = pol(r1 - hubR, s.mid);
      const spoke = mk("line", { x1: s0[0], y1: s0[1], x2: s1[0], y2: s1[1], class: "spoke" }, gE);
      const g = mk("g", {
        class: "h" + (h.start ? " start" : ""), "data-t": "h", "data-id": h.id, tabindex: 0, role: "button",
        "aria-label": `Hub ${marks[i]}: ${h.full ?? h.label}, ${h.people.length} people`, transform: `translate(${hp[0]} ${hp[1]})`,
      }, gH);
      mk("title", {}, g).textContent = `${marks[i]} · ${h.full ?? h.label}`;
      mk("circle", { r: hubR + 5, class: "hring" }, g);
      mk("circle", { r: hubR, class: "badge" }, g);
      mk("text", { class: "mark", dy: "0.35em", "font-size": hubR >= 12 ? 11 : 10 }, g).textContent = marks[i];
      let hlabel: SVGTextElement | null = null;
      if (hubFs >= 9) {
        const left = Math.cos(s.mid) < 0, ap = pol(anchorR, s.mid);
        hlabel = mk("text", {
          class: "lbl hub halo-t", "font-size": hubFs, dy: -4, "text-anchor": left ? "start" : "end",
          transform: `translate(${ap[0]} ${ap[1]}) rotate(${deg(s.mid) + (left ? 180 : 0)})`,
        }, gL);
        hlabel.textContent = h.label;
      }
      refs.current.h[h.id] = { g, spoke, label: hlabel };

      h.people.forEach((id, j) => {
        const p = P[id];
        const t = s.a0 + ((j + 0.5) * (s.a1 - s.a0)) / h.people.length;
        const zig = names ? 0 : (j % 2 ? 1 : -1) * a * 0.7;
        const pp = pol(r2 + zig, t), e = trim(hp, pp, hubR, a);
        const edge = mk("line", { x1: e[0], y1: e[1], x2: e[2], y2: e[3], class: "pe", style: `--c:var(--${p.bucket})` }, gE);
        const pg = mk("g", {
          class: "p", "data-t": "p", "data-id": id, "data-b": p.bucket, tabindex: 0, role: "button", style: `--c:var(--${p.bucket})`,
          "aria-label": `${p.name}, ${roleLine(p)}`, transform: `translate(${pp[0]} ${pp[1]})`,
        }, gP);
        mk("title", {}, pg).textContent = `${p.name} · ${roleLine(p)}`;
        mk("circle", { r: a + 4.5, class: "halo" }, pg);
        mk("circle", { r: a, class: "body" }, pg);
        if (a >= 9.5) mk("text", { class: "ini", dy: "0.35em", "font-size": Math.round(a * 0.78) }, pg).textContent = initialsOf(p.name);
        let lab: SVGTextElement | null = null;
        if (names) {
          const left = Math.cos(t) < 0, lp = pol(r2 + a + 5, t);
          lab = mk("text", {
            class: "lbl", "font-size": fs, dy: "0.34em", "text-anchor": left ? "end" : "start",
            transform: `translate(${lp[0]} ${lp[1]}) rotate(${deg(t) + (left ? 180 : 0)})`,
          }, gL);
          lab.textContent = tagOf(p);
        }
        refs.current.p[id] = { g: pg, edge, label: lab };
      });
    });

    const me = mk("g", { "aria-hidden": "true" }, gM);
    mk("circle", { cx, cy, r: meR * 3, fill: "url(#hrHalo)" }, me);
    mk("circle", { cx, cy, r: meR + 6, class: "mering" }, me);
    mk("circle", { cx, cy, r: meR, fill: "url(#hrCore)" }, me);
    mk("text", { x: cx, y: cy, dy: "0.35em", class: "meini", "font-size": Math.round(meR * 0.66) }, me).textContent = initialsOf(spec.me);
    setDrawn((n) => n + 1);
  }, [hubs, marks, P, spec.me, tagOf, maxSize]);

  useEffect(() => {
    draw();
    let raf = 0, last = wrapRef.current?.clientWidth ?? 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = wrapRef.current?.clientWidth ?? 0;
        if (Math.abs(w - last) > 2) { last = w; draw(); }
      });
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [draw]);

  // ---- state -> classes ----
  const target = hov ?? sel;
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const f = target
      ? target.t === "h"
        ? { h: { [target.id]: 1 }, p: Object.fromEntries((HB[target.id]?.people ?? []).map((i) => [i, 1])) }
        : { h: { [hubOf[target.id]]: 1 }, p: { [target.id]: 1 } }
      : null;
    svg.classList.toggle("focus", !!f);
    for (const id in refs.current.p) {
      const r = refs.current.p[id], on = !!f?.p[id], isOff = !!off[P[id]?.bucket];
      const isSel = sel?.t === "p" && sel.id === id;
      for (const n of [r.g, r.edge, r.label]) { n?.classList.toggle("on", on); n?.classList.toggle("off", isOff); }
      r.g.classList.toggle("sel", isSel);
    }
    for (const id in refs.current.h) {
      const r = refs.current.h[id], on = !!f?.h[id];
      r.g.classList.toggle("on", on); r.g.classList.toggle("sel", sel?.t === "h" && sel.id === id);
      r.spoke.classList.toggle("on", on); r.label?.classList.toggle("on", on);
    }
  }, [target, sel, off, drawn, HB, hubOf, P]);

  const hit = (node: EventTarget | null): Target => {
    const n = (node as Element | null)?.closest?.("[data-t]");
    return n && svgRef.current?.contains(n) ? { t: n.getAttribute("data-t") as "h" | "p", id: n.getAttribute("data-id")! } : null;
  };
  const same = (x: Target, y: Target) => !!x && !!y && x.t === y.t && x.id === y.id;
  const select = (t: Target, keep = false) => setSel((cur) => (!keep && same(t, cur) ? null : t));
  const selHub = sel ? (sel.t === "h" ? sel.id : hubOf[sel.id]) : null;
  const startHubs = hubs.filter((h) => h.start);

  return (
    <div className="hr">
      {startHubs.length > 0 && (
        <section aria-labelledby="hr-paths">
          <h2 id="hr-paths" className="font-display text-3xl font-light text-white">Best paths</h2>
          <p className="mb-4 mt-1 text-mist">Ranked — start at the top. Select a person to see why they matter and open their LinkedIn.</p>
          <ol className="grid gap-2.5">
            {startHubs.map((h) => {
              const openHere = openPath?.hub === h.id ? P[openPath.person] : null;
              return (
                <li key={h.id}>
                  <div role="group" aria-label={`Path ${HB[h.id].mark}: ${h.full ?? h.label}`}
                    className={`hr-path panel cursor-pointer ${selHub === h.id ? "sel" : ""}`}
                    onClick={() => select({ t: "h", id: h.id })}
                    onPointerOver={(e) => e.pointerType !== "touch" && setHov({ t: "h", id: h.id })}
                    onPointerLeave={(e) => e.pointerType !== "touch" && setHov(null)}>
                    <span className="hr-rank">{HB[h.id].mark}</span>
                    <span className="font-display text-xl text-white">{h.full ?? h.label}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="hr-tok me">You</span>
                      {(h.steps?.length ? h.steps : [h.people]).map((group, gi) => (
                        <span key={gi} className="contents">
                          <span className="code text-mist" aria-hidden>→</span>
                          {group.filter((id) => P[id]).map((id) => (
                            <button key={id} type="button" style={cvar(P[id].bucket)} aria-expanded={openHere?.id === id}
                              className={`hr-tok hr-tok-btn ${openHere?.id === id ? "open" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const closing = openHere?.id === id;
                                setOpenPath(closing ? null : { hub: h.id, person: id });
                                select(closing ? { t: "h", id: h.id } : { t: "p", id }, true);
                              }}>
                              <i className="hr-dot !h-2 !w-2" />{P[id].name}
                            </button>
                          ))}
                        </span>
                      ))}
                    </span>
                    {h.note && <span className="text-sm text-mist">{h.note}</span>}
                    {openHere && (
                      <div onClick={(e) => e.stopPropagation()} className="contents">
                        <PathPerson p={openHere} demo={spec.demo} onClose={() => setOpenPath(null)} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="hr-stage">
        <section className="hr-scope panel panel-hi" aria-label="Network map">
          <div className="hr-wrap" ref={wrapRef}>
            <svg
              ref={svgRef}
              role="group"
              aria-label={`Radial map of ${spec.people.length} contacts in ${hubs.length} hubs`}
              onPointerOver={(e) => e.pointerType !== "touch" && setHov(hit(e.target))}
              onPointerLeave={(e) => e.pointerType !== "touch" && setHov(null)}
              onClick={(e) => { const t = hit(e.target); select(t, !t); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { const t = hit(e.target); if (t) { e.preventDefault(); select(t); } } if (e.key === "Escape") setSel(null); }}
              onFocus={(e) => setHov(hit(e.target))}
              onBlur={() => setHov(null)}
            />
          </div>
        </section>

        <section className="hr-card panel" aria-label="Details">
          <Card target={target} spec={spec} P={P} HB={HB} hubOf={hubOf} startCount={startHubs.length} onPick={(t) => select(t, true)} />
        </section>

        <div className="hr-key">
          <div className="flex flex-wrap justify-center gap-2">
            {present.map((b) => (
              <button key={b} type="button" className="hr-chip" style={cvar(b)} aria-pressed={!off[b]} title={BUCKET_INFO[b].hint}
                onClick={() => setOff((o) => ({ ...o, [b]: !o[b] }))}>
                <i className="hr-dot" />{BUCKET_INFO[b].name}
                <span className="code text-[11px] text-mist">{spec.people.filter((p) => p.bucket === b).length}</span>
              </button>
            ))}
          </div>
          {hubs.some((h) => !h.start) && (
            <p className="mt-3 text-center text-[12.5px] leading-loose text-mist">
              Select a type to hide it. Outlined hubs group everyone else:{" "}
              {hubs.map((h, i) => (h.start ? null : (
                <span key={h.id} className="mr-2 whitespace-nowrap"><span className="hr-kb">{marks[i]}</span> {h.full ?? h.label}</span>
              )))}
            </p>
          )}
        </div>
      </div>

      <ListView hubs={hubs} marks={marks} P={P} off={off} onPick={(id) => { select({ t: "p", id }, true); svgRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }} />
    </div>
  );
}

function PathPerson({ p, demo, onClose }: { p: MapPerson; demo?: boolean; onClose: () => void }) {
  return (
    <div className="hr-path-person col-start-2 mt-2 rounded-2xl border border-[var(--hr-line)] bg-black/30 p-4" style={cvar(p.bucket)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2"><i className="hr-dot" />{BUCKET_INFO[p.bucket].name}</p>
          <p className="font-display mt-1 text-2xl text-white">{p.name}</p>
          <p className="text-sm text-mist">{roleLine(p)}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="text-mist hover:text-white">✕</button>
      </div>
      {p.why && <p className="mt-2 text-sm leading-relaxed text-frost/90">{p.why}</p>}
      {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3 px-4 py-2 text-sm">Open on LinkedIn</a> : demo && <span className="btn-primary mt-3 cursor-not-allowed px-4 py-2 text-sm opacity-50" title="Links are hidden in this example">Open on LinkedIn</span>}
    </div>
  );
}

function ListView({ hubs, marks, P, off, onPick }: {
  hubs: MapSpec["hubs"]; marks: string[]; P: Record<string, MapPerson>; off: Record<string, boolean>; onPick: (id: string) => void;
}) {
  const rows = hubs.flatMap((h, i) => h.people.map((id) => ({ hub: h, mark: marks[i], p: P[id] }))).filter((r) => r.p && !off[r.p.bucket]);
  return (
    <section aria-labelledby="hr-list">
      <h2 id="hr-list" className="font-display text-3xl font-light text-white">Everyone on the map</h2>
      <p className="mb-4 mt-1 text-mist">{rows.length} people, in hub order. The type filters above apply here too.</p>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.18em] text-mist">
            <tr>{["Hub", "Name", "Role", "Type", "Why", ""].map((h, i) => <th key={i} className="px-4 py-3.5 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(({ hub, mark, p }) => (
              <tr key={`${hub.id}-${p.id}`} className="border-t border-[var(--hr-line)] align-top hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-4 py-3 text-mist"><span className="hr-kb mr-2">{mark}</span>{hub.label}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onPick(p.id)} className="text-left text-white hover:underline">{p.name}</button>
                </td>
                <td className="px-4 py-3 text-frost">{roleLine(p)}</td>
                <td className="whitespace-nowrap px-4 py-3" style={cvar(p.bucket)}><i className="hr-dot mr-2" /><span className="text-frost">{BUCKET_INFO[p.bucket].name}</span></td>
                <td className="max-w-[340px] px-4 py-3 text-mist">{p.why}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-ice underline decoration-white/20 underline-offset-4">LinkedIn ↗</a>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Card({ target, spec, P, HB, hubOf, startCount, onPick }: {
  target: Target; spec: MapSpec; P: Record<string, MapPerson>;
  HB: Record<string, MapSpec["hubs"][number] & { mark: string; i: number }>; hubOf: Record<string, string>; startCount: number;
  onPick: (t: Target) => void;
}) {
  if (!target) {
    const stats = spec.stats ?? [
      { value: String(spec.people.length), label: "people" },
      { value: String(startCount), label: "places to start" },
      { value: String(Object.keys(HB).length), label: "hubs" },
    ];
    return (
      <>
        <p className="eyebrow">Overview</p>
        <h2 className="font-display mt-2 text-3xl font-light text-white">{spec.people.length} people in {Object.keys(HB).length} hubs</h2>
        <p className="mt-3 text-sm leading-relaxed text-frost/90">
          You are the center. Numbered hubs are where to start, clockwise from the top. Hover a person or hub to preview it, click to pin it.
        </p>
        <ul className="mt-5 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <li key={s.label}><b className="font-display block text-3xl font-light text-white">{s.value}</b><span className="text-xs text-mist">{s.label}</span></li>
          ))}
        </ul>
      </>
    );
  }
  if (target.t === "p") {
    const p = P[target.id], hub = HB[hubOf[target.id]];
    return (
      <>
        <p className="eyebrow flex items-center gap-2"><i className="hr-dot" style={cvar(p.bucket)} />{BUCKET_INFO[p.bucket].name} · Hub {hub.mark}</p>
        <h2 className="font-display mt-2 text-3xl font-light text-white">{p.name}</h2>
        <p className="mt-1 text-sm text-mist">{roleLine(p)}</p>
        {p.why && <p className="mt-3 text-sm leading-relaxed text-frost/90">{p.why}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn-primary px-4 py-2 text-sm">Open on LinkedIn</a> : spec.demo && <span className="btn-primary cursor-not-allowed px-4 py-2 text-sm opacity-50" title="Links are hidden in this example">Open on LinkedIn</span>}
          <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => onPick({ t: "h", id: hub.id })}>View hub {hub.mark}</button>
        </div>
      </>
    );
  }
  const hub = HB[target.id];
  return (
    <>
      <p className="eyebrow">Hub {hub.mark} · {hub.start ? "Start here" : "Also worth a look"}</p>
      <h2 className="font-display mt-2 text-3xl font-light text-white">{hub.full ?? hub.label}</h2>
      {hub.note && <p className="mt-3 text-sm leading-relaxed text-frost/90">{hub.note}</p>}
      <ul className="mt-4 grid gap-0.5">
        {hub.people.map((id) => P[id]).filter(Boolean).map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onPick({ t: "p", id: p.id })}
              className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-white/5">
              <i className="hr-dot" style={cvar(p.bucket)} />
              <span className="text-sm text-white">{p.name}</span>
              <span className="col-start-2 text-xs text-mist">{roleLine(p)}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
