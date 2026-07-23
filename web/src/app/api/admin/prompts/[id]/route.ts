import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import {
  deletePrompt,
  getPromptById,
  updatePrompt,
  type PromptInput,
} from "@/lib/prompts-repo";

export const dynamic = "force-dynamic";

function normalize(body: Record<string, unknown>): PromptInput {
  const asArray = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.map(String).map((s) => s.trim()).filter(Boolean)
      : typeof v === "string"
        ? v.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
  return {
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const prompt = await getPromptById(id);
  if (!prompt)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ prompt });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isDbConfigured())
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  const { id } = await params;
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
  const updated = await updatePrompt(id, input);
  if (!updated)
    return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ prompt: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isDbConfigured())
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  const { id } = await params;
  const ok = await deletePrompt(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
