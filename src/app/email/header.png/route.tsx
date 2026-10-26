import { ImageResponse } from "next/og";

// Header image for transactional emails (shown at 600×200, rendered at 2x).
const FONT = "https://cdn.jsdelivr.net/fontsource/fonts";
const NODES = [
  { x: 820, y: 96, r: 7, glint: true }, { x: 1010, y: 70, r: 6 }, { x: 1110, y: 190, r: 8, glint: true },
  { x: 1020, y: 320, r: 6 }, { x: 860, y: 320, r: 5 }, { x: 760, y: 210, r: 6 },
];
const CORE = { x: 940, y: 200 };

export async function GET() {
  const [display, sans] = await Promise.all([
    fetch(`${FONT}/cormorant-garamond@latest/latin-300-normal.woff`).then((r) => r.arrayBuffer()),
    fetch(`${FONT}/hanken-grotesk@latest/latin-400-normal.woff`).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", position: "relative", color: "#fff",
          backgroundColor: "#030817",
          backgroundImage: "radial-gradient(circle at 82% 30%, #1d3f9e 0%, #0b1a4a 32%, #030817 70%)",
        }}
      >
        <svg width="1200" height="400" viewBox="0 0 1200 400" style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={(i * 137.5) % 1200} cy={(i * 89.3 + 23) % 400} r={(i % 4) * 0.5 + 0.6} fill="#cfdcff" opacity={((i * 7) % 10) / 25 + 0.12} />
          ))}
          <circle cx={CORE.x} cy={CORE.y} r="150" fill="none" stroke="rgba(185,205,255,0.10)" />
          <circle cx={CORE.x} cy={CORE.y} r="230" fill="none" stroke="rgba(185,205,255,0.06)" strokeDasharray="3 8" />
          {NODES.map((n, i) => (
            <line key={`l${i}`} x1={CORE.x} y1={CORE.y} x2={n.x} y2={n.y} stroke={n.glint ? "rgba(127,227,255,0.65)" : "rgba(185,205,255,0.3)"} strokeWidth={n.glint ? 2 : 1.4} />
          ))}
          {NODES.map((n, i) => (
            <circle key={`n${i}`} cx={n.x} cy={n.y} r={n.r} fill={n.glint ? "#7fe3ff" : "#dfe7ff"} />
          ))}
          <circle cx={CORE.x} cy={CORE.y} r="60" fill="rgba(79,125,255,0.22)" />
          <circle cx={CORE.x} cy={CORE.y} r="24" fill="none" stroke="rgba(127,227,255,0.55)" strokeWidth="2" />
          <circle cx={CORE.x} cy={CORE.y} r="15" fill="#bfe3ff" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", position: "relative" }}>
          <div
            style={{
              display: "flex", alignSelf: "flex-start", alignItems: "center", gap: 12, fontFamily: "Hanken", fontSize: 20,
              letterSpacing: 5, color: "#e7d6b0", border: "1.5px solid rgba(231,214,176,0.4)", borderRadius: 999, padding: "8px 22px",
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: "#e7d6b0" }} />
            EARLY ACCESS
          </div>
          <div style={{ display: "flex", fontFamily: "Cormorant", fontSize: 128, lineHeight: 1, marginTop: 22, letterSpacing: 1 }}>Hireco</div>
          <div style={{ display: "flex", fontFamily: "Hanken", fontSize: 24, color: "#8a99c6", marginTop: 10 }}>Your next role is one introduction away.</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 400,
      fonts: [
        { name: "Cormorant", data: display, weight: 300, style: "normal" },
        { name: "Hanken", data: sans, weight: 400, style: "normal" },
      ],
      headers: { "cache-control": "public, max-age=86400, s-maxage=31536000" },
    },
  );
}
