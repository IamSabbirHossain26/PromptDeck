// Creates the prompts table on the remote Postgres database.
// Usage (from web/):  node scripts/db-setup.mjs
// Requires DATABASE_URL in the environment (or web/.env.local).
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

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

const sql = `
CREATE TABLE IF NOT EXISTS prompts (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  author      TEXT NOT NULL DEFAULT 'PromptDeck',
  description TEXT NOT NULL DEFAULT '',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  models      TEXT[] NOT NULL DEFAULT '{}',
  prompt      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prompts_category_idx ON prompts (category);
CREATE INDEX IF NOT EXISTS prompts_title_idx ON prompts (title);
`;

try {
  await pool.query(sql);
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM prompts");
  console.log(`✓ Table ready. Current row count: ${rows[0].n}`);
} catch (e) {
  console.error("Setup failed:", e.message);
  process.exit(1);
} finally {
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
    /* no .env.local — rely on process env */
  }
}
