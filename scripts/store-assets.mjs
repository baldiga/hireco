// Builds Chrome Web Store images (1280×800 screenshots + 440×280 promo tile) from UI captures.
// Usage: node scripts/store-assets.mjs <hero.jpg> <radar.jpg> <list.jpg> <popup.png>
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const [hero, radar, list, popup] = process.argv.slice(2);
const OUT = "dist/store";
const W = 1280, H = 800;

const bg = (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="a" cx="85%" cy="0%" r="80%"><stop offset="0" stop-color="#1d3f9e"/><stop offset=".45" stop-color="#0a1a45"/><stop offset="1" stop-color="#030817"/></radialGradient>
    <radialGradient id="b" cx="0%" cy="100%" r="60%"><stop offset="0" stop-color="#10286f" stop-opacity=".7"/><stop offset="1" stop-color="#030817" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/>
</svg>`);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const caption = (eyebrow, title, x = 72, y = 88, w = W) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="200">
  <text x="${x}" y="${y - 44}" font-family="Segoe UI, Arial, sans-serif" font-size="15" letter-spacing="4" fill="#e7d6b0">${esc(eyebrow.toUpperCase())}</text>
  <text x="${x}" y="${y}" font-family="Georgia, 'Times New Roman', serif" font-size="44" fill="#ffffff">${esc(title)}</text>
</svg>`);

async function framed(src, crop, maxW, maxH = 10000) {
  // Scale the crop to fit inside maxW × maxH.
  const scale = Math.min(maxW / crop.width, maxH / crop.height);
  const width = Math.round(crop.width * scale), height = Math.round(crop.height * scale);
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="18" ry="18"/></svg>`);
  const rounded = await sharp(src).extract(crop).resize(width, height).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const border = Buffer.from(`<svg width="${width}" height="${height}"><rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="18" ry="18" fill="none" stroke="#3a4f8f" stroke-opacity=".6"/></svg>`);
  return { buf: await sharp(rounded).composite([{ input: border }]).png().toBuffer(), width, height };
}

async function slide(name, eyebrow, title, src, crop, maxW) {
  const top = 150;
  const shot = await framed(src, crop, maxW, H - top - 36);
  const left = Math.round((W - shot.width) / 2);
  const shadow = await sharp(Buffer.from(`<svg width="${W}" height="${H}"><rect x="${left}" y="${top + 14}" width="${shot.width}" height="${shot.height}" rx="18" fill="#000" fill-opacity=".55"/></svg>`)).blur(22).png().toBuffer();
  await sharp(bg(W, H))
    .composite([{ input: caption(eyebrow, title), left: 0, top: 0 }, { input: shadow, left: 0, top: 0 }, { input: shot.buf, left, top }])
    .png().toFile(`${OUT}/${name}`);
  console.log("wrote", name);
}

await mkdir(OUT, { recursive: true });
await slide("1-hero.png", "Hireco", "Your next role is one introduction away.", hero, { left: 300, top: 95, width: 960, height: 400 }, 1136);
await slide("2-radar.png", "Your hiring map", "See every path in — ranked, at a glance.", radar, { left: 322, top: 4, width: 912, height: 630 }, 900);
await slide("3-list.png", "Who to talk to", "Best paths first. Start with the crowned name.", list, { left: 322, top: 0, width: 912, height: 744 }, 900);

// Popup slide: text left, popup right.
{
  const pop = await framed(popup, { left: 0, top: 0, width: 340, height: 664 }, 300);
  const copy = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="${H}">
    <text x="0" y="260" font-family="Segoe UI, Arial, sans-serif" font-size="15" letter-spacing="4" fill="#e7d6b0">THE EXTENSION</text>
    <text x="0" y="320" font-family="Georgia, serif" font-size="46" fill="#fff">Sync your network</text>
    <text x="0" y="374" font-family="Georgia, serif" font-size="46" fill="#b9cdff" font-style="italic">in one click.</text>
    ${["Reads your connections from your own LinkedIn session", "Never sees your LinkedIn password", "Your maps, kept for 14 days"].map((t, i) =>
      `<circle cx="6" cy="${448 + i * 44}" r="4" fill="#7fe3ff"/><text x="24" y="${454 + i * 44}" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#dfe7ff">${t}</text>`).join("")}
  </svg>`);
  await sharp(bg(W, H)).composite([{ input: copy, left: 96, top: 0 }, { input: pop.buf, left: 860, top: Math.round((H - pop.height) / 2) }]).png().toFile(`${OUT}/4-extension.png`);
  console.log("wrote 4-extension.png");
}

// Small promo tile 440×280.
{
  const tile = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280">
    <g stroke="#b9cdff" stroke-opacity=".35"><line x1="345" y1="140" x2="300" y2="70"/><line x1="345" y1="140" x2="405" y2="85"/><line x1="345" y1="140" x2="410" y2="200"/><line x1="345" y1="140" x2="290" y2="210"/></g>
    <g fill="#dfe7ff"><circle cx="300" cy="70" r="5" fill="#7fe3ff"/><circle cx="405" cy="85" r="4"/><circle cx="410" cy="200" r="5" fill="#7fe3ff"/><circle cx="290" cy="210" r="4"/></g>
    <circle cx="345" cy="140" r="26" fill="#4f7dff" fill-opacity=".25"/><circle cx="345" cy="140" r="10" fill="#cfe6ff"/>
    <text x="32" y="122" font-family="Georgia, serif" font-size="52" fill="#fff">Hireco</text>
    <text x="34" y="160" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#b9c6ea">Who in your network</text>
    <text x="34" y="182" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#b9c6ea">can get you hired.</text>
  </svg>`);
  await sharp(bg(440, 280)).composite([{ input: tile }]).png().toFile(`${OUT}/promo-440x280.png`);
  console.log("wrote promo-440x280.png");
}
