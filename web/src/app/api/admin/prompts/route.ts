import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { createPrompt, listPrompts, type PromptInput } from "@/lib/prompts-repo";

export const dynamic = "force-dynamic";

function normalize(body: Record<string, unknown>): PromptInput {
  const asArray = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.map(String).map((s) => s.trim()).filter(Boolean)
      : typeof v === "string"
        ? v.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
  return {
    id: typeof body.id === "string" ? body.id.trim() : undefined,
    title: String(body.title ?? "").trim(),
    category: String(body.category ?? "").trim(),
    subcategory: String(body.subcategory ?? "").trim(),
    author: String(body.author ?? "PromptDeck").trim() || "PromptDeck",
    description: String(body.description ?? "").trim(),
    tags: asArray(body.tags),
    models: asArray(body.models),
    prompt: String(body.prompt ?? "").trim(),
  };
}

export async function GET() {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const prompts = await listPrompts();
  return NextResponse.json({ count: prompts.length, prompts });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isDbConfigured())
    return NextResponse.json(
      { error: "Database not configured — set DATABASE_URL to enable editing." },
      { status: 503 }
    );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const input = normalize(body);
  if (!input.title || !input.category || !input.prompt) {
    return NextResponse.json(
      { error: "title, category and prompt are required" },
      { status: 400 }
    );
  }
  try {
    const created = await createPrompt(input);
    return NextResponse.json({ prompt: created }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create failed";
    // Unique-violation on the id primary key.
    const status = /duplicate key|unique/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
