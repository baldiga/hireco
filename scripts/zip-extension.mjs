// Packs extension/ into zips (runs before every build):
//  - public/downloads/hireco-extension.zip  → "Load unpacked" download on the site
//  - dist/hireco-chrome-web-store.zip       → upload to the Chrome Web Store (no localhost / legacy hosts)
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import JSZip from "jszip";

const SRC = "extension";
const STORE_DROP_HOSTS = ["http://localhost:3000/*", "https://hireco-seven.vercel.app/*"];

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)])));
  return nested.flat();
}

async function pack(out, { folder, transformManifest }) {
  const zip = new JSZip();
  const root = folder ? zip.folder(folder) : zip;
  for (const file of await files(SRC)) {
    const name = relative(SRC, file).replaceAll("\\", "/");
    let data = await readFile(file);
    if (name === "manifest.json" && transformManifest) data = JSON.stringify(transformManifest(JSON.parse(data)), null, 2);
    root.file(name, data);
  }
  await writeFile(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log(`extension packed -> ${out}`);
}

await mkdir("public/downloads", { recursive: true });
await mkdir("dist", { recursive: true });
await pack("public/downloads/hireco-extension.zip", { folder: "hireco-extension" });
await pack("dist/hireco-chrome-web-store.zip", {
  // The store wants manifest.json at the zip root and only the hosts the extension really needs.
  transformManifest: (m) => ({ ...m, host_permissions: m.host_permissions.filter((h) => !STORE_DROP_HOSTS.includes(h)) }),
});
