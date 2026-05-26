import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");

async function copy(source, target) {
  const output = resolve(dist, target);
  await mkdir(dirname(output), { recursive: true });
  await copyFile(resolve(root, source), output);
}

await copy("manifest.json", "manifest.json");
