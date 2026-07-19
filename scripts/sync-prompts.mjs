// Keeps extension/prompts.json in sync with the web app's source of truth.
// Run from repo root:  node scripts/sync-prompts.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "web", "src", "data", "prompts.json");
const dest = join(root, "extension", "prompts.json");

const data = await readFile(src, "utf8");
JSON.parse(data); // validate
await writeFile(dest, data);
console.log(`Synced ${JSON.parse(data).length} prompts → extension/prompts.json`);
