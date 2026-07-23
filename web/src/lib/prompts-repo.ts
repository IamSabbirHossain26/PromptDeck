import { getPool } from "./db";
import { prompts as fallbackPrompts, type Prompt } from "@/data/prompts";

export type { Prompt };

export type PromptInput = Omit<Prompt, "id"> & { id?: string };

/**
 * Data access for prompts. Reads/writes the Postgres `prompts` table when
 * DATABASE_URL is set; otherwise falls back to the bundled prompts.json for
 * reads (writes require a database).
 */

function rowToPrompt(r: Record<string, unknown>): Prompt {
  return {
    id: r.id as string,
    title: r.title as string,
    category: r.category as string,
    subcategory: (r.subcategory as string) ?? "",
    author: (r.author as string) ?? "PromptDeck",
    description: (r.description as string) ?? "",
    tags: (r.tags as string[]) ?? [],
    models: (r.models as string[]) ?? [],
    prompt: r.prompt as string,
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function sortedFallback(): Prompt[] {
  return [...fallbackPrompts].sort((a, b) => a.title.localeCompare(b.title));
}

export async function listPrompts(): Promise<Prompt[]> {
  const pool = getPool();
  if (!pool) return sortedFallback();
  try {
    const { rows } = await pool.query("SELECT * FROM prompts ORDER BY title ASC");
    // A configured-but-empty DB (not seeded yet) still uses the bundled set so
    // the site is never blank.
    return rows.length ? rows.map(rowToPrompt) : sortedFallback();
  } catch (e) {
    // DB unreachable / table missing / auth failure — keep the site up on the
    // bundled library instead of crashing the page.
    console.error(
      "[prompts-repo] DB read failed, using bundled fallback:",
      e instanceof Error ? e.message : e
    );
    return sortedFallback();
  }
}

export async function getPromptById(id: string): Promise<Prompt | null> {
  const pool = getPool();
  if (!pool) return fallbackPrompts.find((p) => p.id === id) ?? null;
  try {
    const { rows } = await pool.query("SELECT * FROM prompts WHERE id = $1", [id]);
    return rows[0]
      ? rowToPrompt(rows[0])
      : (fallbackPrompts.find((p) => p.id === id) ?? null);
  } catch (e) {
    console.error(
      "[prompts-repo] DB read failed, using bundled fallback:",
      e instanceof Error ? e.message : e
    );
    return fallbackPrompts.find((p) => p.id === id) ?? null;
  }
}

export async function createPrompt(input: PromptInput): Promise<Prompt> {
  const pool = getPool();
  if (!pool) throw new Error("Database not configured");
  const id = (input.id?.trim() || slugify(input.title)) as string;
  const { rows } = await pool.query(
    `INSERT INTO prompts (id, title, category, subcategory, author, description, tags, models, prompt)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      id,
      input.title,
      input.category,
      input.subcategory ?? "",
      input.author ?? "PromptDeck",
      input.description ?? "",
      input.tags ?? [],
      input.models ?? [],
      input.prompt,
    ]
  );
  return rowToPrompt(rows[0]);
}

export async function updatePrompt(
  id: string,
  input: PromptInput
): Promise<Prompt | null> {
  const pool = getPool();
  if (!pool) throw new Error("Database not configured");
  const { rows } = await pool.query(
    `UPDATE prompts SET
       title = $2, category = $3, subcategory = $4, author = $5,
       description = $6, tags = $7, models = $8, prompt = $9,
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.title,
      input.category,
      input.subcategory ?? "",
      input.author ?? "PromptDeck",
      input.description ?? "",
      input.tags ?? [],
      input.models ?? [],
      input.prompt,
    ]
  );
  return rows[0] ? rowToPrompt(rows[0]) : null;
}

export async function deletePrompt(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) throw new Error("Database not configured");
  const res = await pool.query("DELETE FROM prompts WHERE id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function listCategories(): Promise<string[]> {
  const all = await listPrompts();
  return Array.from(new Set(all.map((p) => p.category))).sort();
}
