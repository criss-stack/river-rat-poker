import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const requiredFiles = ["index.html", "style.css", "script.js"];
const assetReferences = new Set();
const failures = [];

for (const file of requiredFiles) {
  const path = join(root, file);
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${file}`);
  }
}

function collectAssetReferences(file) {
  const filePath = join(root, file);
  const contents = readFileSync(filePath, "utf8");
  const patterns = [
    /(?:src|href)=["'](assets\/[^"']+)["']/g,
    /url\(["']?(assets\/[^"')]+)["']?\)/g,
    /["'](assets\/[^"']+)["']/g
  ];

  for (const pattern of patterns) {
    for (const match of contents.matchAll(pattern)) {
      assetReferences.add(match[1]);
    }
  }
}

for (const file of requiredFiles) {
  if (existsSync(join(root, file))) {
    collectAssetReferences(file);
  }
}

for (const asset of assetReferences) {
  if (!existsSync(join(root, asset))) {
    failures.push(`Missing asset reference: ${asset}`);
  }
}

const index = readFileSync(join(root, "index.html"), "utf8");

if (!/<script src="script\.js(?:\?[^"]*)?"><\/script>/.test(index)) {
  failures.push("index.html must load script.js.");
}

if (!index.includes('<link rel="stylesheet" href="style.css"')) {
  failures.push("index.html must load style.css.");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Smoke test passed. Checked ${requiredFiles.length} core files and ${assetReferences.size} asset references.`);
