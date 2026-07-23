import { Pool } from "pg";

/**
 * Shared Postgres pool for the remote Hostinger database.
 *
 * Configure via env:
 *   DATABASE_URL   postgres://user:pass@host:5432/dbname
 *   DATABASE_SSL   "false" to disable SSL (default: SSL on, self-signed allowed)
 *
 * When DATABASE_URL is absent, getPool() returns null and the repository layer
 * transparently falls back to the bundled prompts.json — so the site keeps
 * working before the database is wired up.
 */

declare global {
  // Reuse the pool across hot reloads / serverless invocations.
  // eslint-disable-next-line no-var
  var __pdPool: Pool | null | undefined;
}

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (global.__pdPool !== undefined) return global.__pdPool;

  const useSsl = process.env.DATABASE_SSL !== "false";
  global.__pdPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Hostinger's managed Postgres uses SSL with a certificate that Node won't
    // trust by default; rejectUnauthorized:false accepts it for the encrypted
    // connection without failing on the CA.
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
    idleTimeoutMillis: 30_000,
    // Fail fast if the DB is unreachable so pages fall back quickly.
    connectionTimeoutMillis: 5_000,
  });

  global.__pdPool.on("error", (err) => {
    console.error("[db] idle client error", err.message);
  });

  return global.__pdPool;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
