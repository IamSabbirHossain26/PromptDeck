"use client";

import { useMemo, useState } from "react";
import type { Prompt } from "@/data/prompts";

export function LibraryClient({
  prompts,
  categories,
}: {
  prompts: Prompt[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [active, setActive] = useState<Prompt | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prompts.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return [p.title, p.description, p.subcategory, p.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [prompts, query, category]);

  async function copy(p: Prompt) {
    try {
      await navigator.clipboard.writeText(p.prompt);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId((c) => (c === p.id ? null : c)), 1500);
    } catch {
      // clipboard blocked — ignore
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Prompt Library</h1>
        <p className="mt-2 text-muted">
          {prompts.length} curated prompts. Search, filter, and copy — or use
          them one-click with the extension.
        </p>
      </div>

      {/* Controls */}
      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts…"
            className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
                  category === c
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-card text-muted hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted">
        Showing {filtered.length} of {prompts.length}
      </p>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-xl border border-border bg-card p-5"
          >
            <div className="text-xs font-medium text-brand">
              {p.category} / {p.subcategory}
            </div>
            <h3 className="mt-2 font-semibold leading-snug">{p.title}</h3>
            <p className="mt-2 flex-1 text-sm text-muted">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.models.map((m) => (
                <span
                  key={m}
                  className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-muted"
                >
                  {m}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => copy(p)}
                className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                {copiedId === p.id ? "Copied!" : "Copy prompt"}
              </button>
              <button
                onClick={() => setActive(p)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface"
              >
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted">
          No prompts match &ldquo;{query}&rdquo;.
        </div>
      )}

      {/* Modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-brand">
                  {active.category} / {active.subcategory}
                </div>
                <h2 className="mt-1 text-xl font-bold">{active.title}</h2>
              </div>
              <button
                onClick={() => setActive(null)}
                className="rounded-lg border border-border px-2 py-1 text-sm text-muted hover:bg-surface"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">{active.description}</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-surface p-4 text-sm leading-relaxed">
              {active.prompt}
            </pre>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => copy(active)}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {copiedId === active.id ? "Copied!" : "Copy prompt"}
              </button>
              <span className="self-center text-xs text-muted">
                by {active.author}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
