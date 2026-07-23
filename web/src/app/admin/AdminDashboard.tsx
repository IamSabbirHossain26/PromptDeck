"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Prompt } from "@/data/prompts";

type Draft = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  author: string;
  description: string;
  tags: string;
  models: string;
  prompt: string;
};

const empty: Draft = {
  id: "",
  title: "",
  category: "",
  subcategory: "",
  author: "PromptDeck",
  description: "",
  tags: "",
  models: "GPT-4o, Claude",
  prompt: "Role: You are ...\n\nTask: ...\n\nFormat: ...",
};

function toDraft(p: Prompt): Draft {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    subcategory: p.subcategory,
    author: p.author,
    description: p.description,
    tags: p.tags.join(", "),
    models: p.models.join(", "),
    prompt: p.prompt,
  };
}

export function AdminDashboard({
  initialPrompts,
  dbConfigured,
}: {
  initialPrompts: Prompt[];
  dbConfigured: boolean;
}) {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(prompts.map((p) => p.category))).sort()],
    [prompts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prompts.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return [p.id, p.title, p.description, p.category, p.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [prompts, query, category]);

  async function refresh() {
    const res = await fetch("/api/admin/prompts");
    if (res.ok) {
      const data = await res.json();
      setPrompts(data.prompts);
    }
  }

  function startNew() {
    setError(null);
    setEditing({ ...empty });
    setIsNew(true);
  }
  function startEdit(p: Prompt) {
    setError(null);
    setEditing(toDraft(p));
    setIsNew(false);
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...editing,
        tags: editing.tags.split(",").map((s) => s.trim()).filter(Boolean),
        models: editing.models.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const url = isNew
        ? "/api/admin/prompts"
        : `/api/admin/prompts/${encodeURIComponent(editing.id)}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      await refresh();
      setEditing(null);
      setNotice(isNew ? "Prompt created." : "Prompt updated.");
      setTimeout(() => setNotice(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Prompt) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/prompts/${encodeURIComponent(p.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await refresh();
      setNotice("Prompt deleted.");
      setTimeout(() => setNotice(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Prompt Admin</h1>
          <p className="mt-1 text-sm text-muted">
            {prompts.length} prompts ·{" "}
            {dbConfigured ? (
              <span className="text-brand">Database connected</span>
            ) : (
              <span className="text-amber-500">
                Read-only (DATABASE_URL not set)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startNew}
            disabled={!dbConfigured}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            + New prompt
          </button>
          <button
            onClick={logout}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface"
          >
            Log out
          </button>
        </div>
      </div>

      {!dbConfigured && (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          Showing the bundled fallback library. Set{" "}
          <code>DATABASE_URL</code> and run{" "}
          <code>node scripts/db-setup.mjs &amp;&amp; node scripts/db-seed.mjs</code>{" "}
          to enable editing.
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-lg border border-brand/40 bg-brand/10 p-3 text-sm text-brand">
          {notice}
        </div>
      )}

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, id, tag…"
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-sm text-muted">
        Showing {filtered.length} of {prompts.length}
      </p>

      {/* Table */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Title</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">ID</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{p.title}</div>
                  <div className="line-clamp-1 text-xs text-muted">
                    {p.description}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted">
                  {p.category} / {p.subcategory}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">
                  {p.id}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => startEdit(p)}
                    className="rounded border border-border px-2.5 py-1 text-xs hover:bg-surface"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(p)}
                    disabled={!dbConfigured || busy}
                    className="ml-2 rounded border border-red-500/40 px-2.5 py-1 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No prompts match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Editor modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
          onClick={() => !busy && setEditing(null)}
        >
          <div
            className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">
              {isNew ? "New prompt" : "Edit prompt"}
            </h2>
            {error && (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="ID (slug)">
                <input
                  value={editing.id}
                  disabled={!isNew}
                  onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                  placeholder="auto from title if blank"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-brand disabled:opacity-60"
                />
              </Field>
              <Field label="Title *">
                <input
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Field label="Category *">
                <input
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Field label="Subcategory">
                <input
                  value={editing.subcategory}
                  onChange={(e) =>
                    setEditing({ ...editing, subcategory: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Field label="Author">
                <input
                  value={editing.author}
                  onChange={(e) =>
                    setEditing({ ...editing, author: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Field label="Models (comma-separated)">
                <input
                  value={editing.models}
                  onChange={(e) =>
                    setEditing({ ...editing, models: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Tags (comma-separated)">
                <input
                  value={editing.tags}
                  onChange={(e) =>
                    setEditing({ ...editing, tags: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Description">
                <textarea
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Prompt * (Role / Task / Format)">
                <textarea
                  value={editing.prompt}
                  onChange={(e) =>
                    setEditing({ ...editing, prompt: e.target.value })
                  }
                  rows={10}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-brand"
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                disabled={busy}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Saving…" : isNew ? "Create" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
