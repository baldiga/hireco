// Hero illustration: you at the center, the six kinds of people who get you hired around you.
const NODES = [
  { x: 120, y: 92, label: "Hiring manager", sub: "VP Growth · Monday.com", strong: true },
  { x: 418, y: 70, label: "Ex-coworker", sub: "2 yrs together at Wix", strong: true },
  { x: 492, y: 252, label: "Insider", sub: "Product · Stripe" },
  { x: 404, y: 420, label: "Introducer", sub: "4 yrs at Stripe" },
  { x: 120, y: 400, label: "Recruiter", sub: "Talent · Monday.com" },
  { x: 58, y: 246, label: "Decision maker", sub: "CMO · Stripe" },
];
const STARS = Array.from({ length: 38 }, (_, i) => ({
  x: (i * 137.5) % 560,
  y: (i * 89.3 + 23) % 500,
  r: (i % 4) * 0.35 + 0.4,
  o: ((i * 7) % 10) / 22 + 0.12,
}));
const C = { x: 280, y: 250 };

export default function Constellation() {
  return (
    <svg viewBox="-110 -10 780 520" className="h-auto w-full" role="img" aria-label="Your network as a hiring map">
      <defs>
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#a8dcff" />
          <stop offset="1" stopColor="#2f5bea" />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#4f7dff" stopOpacity=".45" />
          <stop offset="1" stopColor="#4f7dff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0" x2="1">
          <stop offset="0" stopColor="#7fe3ff" stopOpacity=".9" />
          <stop offset="1" stopColor="#4f7dff" stopOpacity=".25" />
        </linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="1.2" /></filter>
      </defs>

      {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#cfdcff" opacity={s.o} />)}
      <circle cx={C.x} cy={C.y} r="150" fill="none" stroke="rgba(185,205,255,.08)" />
      <circle cx={C.x} cy={C.y} r="220" fill="none" stroke="rgba(185,205,255,.05)" strokeDasharray="2 6" />

      {NODES.map((n, i) => (
        <g key={n.label}>
          <line x1={C.x} y1={C.y} x2={n.x} y2={n.y} stroke="rgba(185,205,255,.14)" />
          <line x1={C.x} y1={C.y} x2={n.x} y2={n.y} stroke="url(#beam)" strokeWidth={n.strong ? 1.4 : 0.9} className="flow" style={{ animationDelay: `${i * 0.4}s` }} />
        </g>
      ))}

      <circle cx={C.x} cy={C.y} r="90" fill="url(#halo)" />
      <circle cx={C.x} cy={C.y} r="9" fill="none" stroke="#7fe3ff" style={{ animation: "pulse-ring 2.8s ease-out infinite" }} />
      <circle cx={C.x} cy={C.y} r="13" fill="url(#core)" />
      <text x={C.x} y={C.y + 36} textAnchor="middle" fill="#fff" style={{ font: "italic 300 20px var(--font-display)" }}>you</text>

      {NODES.map((n, i) => {
        const left = n.x < C.x;
        return (
          <g key={n.label} className="float" style={{ animationDelay: `${i * -1.1}s` }}>
            <circle cx={n.x} cy={n.y} r={n.strong ? 7 : 5.5} fill="#dfe7ff" filter="url(#soft)" opacity=".6" />
            <circle cx={n.x} cy={n.y} r={n.strong ? 5 : 4} fill={n.strong ? "#7fe3ff" : "#dfe7ff"} />
            <text x={n.x + (left ? -14 : 14)} y={n.y - 4} textAnchor={left ? "end" : "start"} fill="#fff" style={{ font: "400 13px var(--font-sans)", letterSpacing: ".02em" }}>{n.label}</text>
            <text x={n.x + (left ? -14 : 14)} y={n.y + 13} textAnchor={left ? "end" : "start"} fill="#8a99c6" style={{ font: "300 11.5px var(--font-sans)" }}>{n.sub}</text>
          </g>
        );
      })}
    </svg>
  );
}
