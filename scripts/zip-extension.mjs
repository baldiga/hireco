// Packs extension/ into public/downloads/hireco-extension.zip (runs before every build).
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import JSZip from "jszip";

const SRC = "extension";
const OUT = "public/downloads/hireco-extension.zip";

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)])));
  return nested.flat();
}

const zip = new JSZip();
const folder = zip.folder("hireco-extension");
for (const file of await files(SRC)) folder.file(relative(SRC, file).replaceAll("\\", "/"), await readFile(file));

await mkdir("public/downloads", { recursive: true });
await writeFile(OUT, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
console.log(`extension packed -> ${OUT}`);
