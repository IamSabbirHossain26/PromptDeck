// Imports every prompt from src/data/prompts.json into the Postgres database.
// Idempotent: upserts by id, so re-running syncs edits without duplicates.
// Usage (from web/):  node scripts/db-seed.mjs
import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(join(root, ".env.local"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (add it to web/.env.local).");
  process.exit(1);
}

const prompts = JSON.parse(
  readFileSync(join(root, "src", "data", "prompts.json"), "utf8")
);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

const upsert = `
INSERT INTO prompts (id, title, category, subcategory, author, description, tags, models, prompt)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
ON CONFLICT (id) DO UPDATE SET
  title=EXCLUDED.title, category=EXCLUDED.category, subcategory=EXCLUDED.subcategory,
  author=EXCLUDED.author, description=EXCLUDED.description, tags=EXCLUDED.tags,
  models=EXCLUDED.models, prompt=EXCLUDED.prompt, updated_at=now()
`;

const client = await pool.connect();
try {
  await client.query("BEGIN");
  let n = 0;
  for (const p of prompts) {
    await client.query(upsert, [
      p.id, p.title, p.category, p.subcategory ?? "", p.author ?? "PromptDeck",
      p.description ?? "", p.tags ?? [], p.models ?? [], p.prompt,
    ]);
    n++;
  }
  await client.query("COMMIT");
  const { rows } = await client.query("SELECT COUNT(*)::int AS total FROM prompts");
  console.log(`✓ Upserted ${n} prompts. Table now holds ${rows[0].total}.`);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("Seed failed:", e.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* rely on process env */
  }
}
