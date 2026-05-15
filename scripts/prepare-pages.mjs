import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = join(root, "dist");
const filesToPublish = ["index.html", "style.css", "script.js", "service-worker.js", "manifest.json", "offline.html", "assets"];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const file of filesToPublish) {
  cpSync(join(root, file), join(dist, file), {
    filter: (source) => !source.endsWith(".DS_Store"),
    recursive: true
  });
}

console.log(`Prepared GitHub Pages build in ${dist}`);
