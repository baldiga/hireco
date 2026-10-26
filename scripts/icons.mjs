// One-off: renders the extension icon. Run: node scripts/icons.mjs
import sharp from "sharp";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="bg" cx="70%" cy="25%" r="90%"><stop offset="0" stop-color="#2a4fd0"/><stop offset=".55" stop-color="#0c1d55"/><stop offset="1" stop-color="#040a1c"/></radialGradient>
    <radialGradient id="core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9fd8ff"/><stop offset="1" stop-color="#3f6cff"/></radialGradient>
  </defs>
  <rect width="128" height="128" rx="30" fill="url(#bg)"/>
  <g stroke="#b9cdff" stroke-opacity=".55" stroke-width="2.5" fill="none">
    <line x1="64" y1="64" x2="30" y2="36"/><line x1="64" y1="64" x2="98" y2="40"/><line x1="64" y1="64" x2="92" y2="96"/><line x1="64" y1="64" x2="32" y2="92"/>
  </g>
  <g fill="#dfe7ff"><circle cx="30" cy="36" r="7"/><circle cx="98" cy="40" r="6"/><circle cx="92" cy="96" r="7"/><circle cx="32" cy="92" r="5"/></g>
  <circle cx="64" cy="64" r="14" fill="url(#core)"/>
</svg>`;
for (const size of [16, 32, 48, 128]) await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`extension/icons/icon-${size}.png`);
await sharp(Buffer.from(svg)).resize(64, 64).png().toFile("src/app/icon.png");
console.log("icons written");
