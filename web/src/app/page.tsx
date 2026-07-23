import Link from "next/link";
import { listPrompts, listCategories } from "@/lib/prompts-repo";
import { FreemiusCheckout } from "@/components/FreemiusCheckout";

export const dynamic = "force-dynamic";

const features = [
  {
    title: "Curated Prompt Library",
    body: "Hand-crafted, tested prompts for SEO, copywriting, marketing, and productivity — not random dumps. Every prompt uses fill-in-the-blank variables so you get usable output on the first try.",
    icon: "📚",
  },
  {
    title: "One Click, Right in the Chat",
    body: "Our browser extension drops a prompt panel straight into ChatGPT and Claude. Click a prompt, it fills the box. No copy-pasting between tabs.",
    icon: "⚡",
  },
  {
    title: "Tone & Language Controls",
    body: "Set output language, tone, and writing style once — every prompt respects it. Write like a pro in any voice, in any language.",
    icon: "🎛️",
  },
  {
    title: "Half the Price",
    body: "The same core workflow the big players charge $20+/mo for. We keep it lean and pass the savings on: $10/mo, cancel anytime.",
    icon: "💸",
  },
];

const steps = [
  {
    n: "1",
    title: "Install the extension",
    body: "Add PromptDeck to Chrome in one click. It works on chatgpt.com and claude.ai.",
  },
  {
    n: "2",
    title: "Open ChatGPT or Claude",
    body: "A prompt panel appears above the message box, synced with our library.",
  },
  {
    n: "3",
    title: "Click a prompt & go",
    body: "Pick a prompt, fill in the blanks, and get expert-level results instantly.",
  },
];

export default async function Home() {
  const [prompts, categories] = await Promise.all([
    listPrompts(),
    listCategories(),
  ]);
  const featured = prompts.slice(0, 6);
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_18%,transparent),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Works with ChatGPT & Claude
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Your Cheat Code for{" "}
            <span className="text-brand">ChatGPT & Claude</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            PromptDeck adds a library of curated, one-click prompts right inside
            your AI chat. Get expert results for SEO, marketing, and writing —
            without becoming a prompt engineer.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#extension"
              className="w-full rounded-lg bg-brand px-6 py-3 font-medium text-white transition hover:opacity-90 sm:w-auto"
            >
              Add to Chrome — Free trial
            </Link>
            <Link
              href="/library"
              className="w-full rounded-lg border border-border px-6 py-3 font-medium transition hover:bg-surface sm:w-auto"
            >
              Browse {prompts.length}+ prompts
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">
            No credit card for the free trial · Cancel anytime · $10/mo after
          </p>

          {/* Stats */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4">
            {[
              { k: `${prompts.length}+`, v: "Curated prompts" },
              { k: `${categories.length}`, v: "Categories" },
              { k: "2", v: "Platforms supported" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="text-2xl font-bold text-brand">{s.k}</div>
                <div className="mt-1 text-sm text-muted">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need to prompt like a pro
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Built for freelancers, marketers, and teams who use AI every day.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="extension" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            How PromptDeck works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            From install to expert output in under a minute.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
          The extension lives in <code className="text-foreground">/extension</code>. Load it
          via <code className="text-foreground">chrome://extensions</code> → Developer mode →
          &ldquo;Load unpacked&rdquo;. Chrome Web Store listing coming at launch.
        </div>
      </section>

      {/* Featured prompts */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Popular prompts
              </h2>
              <p className="mt-2 text-muted">A taste of what&apos;s inside.</p>
            </div>
            <Link
              href="/library"
              className="hidden text-sm font-medium text-brand hover:underline sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <Link
                key={p.id}
                href="/library"
                className="rounded-xl border border-border bg-card p-5 transition hover:border-brand"
              >
                <div className="text-xs font-medium text-brand">
                  {p.category} / {p.subcategory}
                </div>
                <h3 className="mt-2 font-semibold">{p.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">
                  {p.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Simple, honest pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            One plan. Everything included. Half what the others charge.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-2 text-sm text-muted">
              Try the workflow, keep the basics.
            </p>
            <div className="mt-6 text-4xl font-bold">
              $0
              <span className="text-base font-normal text-muted">/mo</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Browse the full public library",
                "Copy prompts manually",
                "Community prompts",
              ].map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand">✓</span>
                  {i}
                </li>
              ))}
            </ul>
            <Link
              href="/library"
              className="mt-8 block rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium hover:bg-surface"
            >
              Start browsing
            </Link>
          </div>
          <div className="relative rounded-2xl border-2 border-brand bg-card p-8">
            <span className="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">
              Most popular
            </span>
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="mt-2 text-sm text-muted">
              The full one-click experience.
            </p>
            <div className="mt-6 text-4xl font-bold">
              $10
              <span className="text-base font-normal text-muted">/mo</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "One-click prompts inside ChatGPT & Claude",
                "Tone, language & writing-style controls",
                "Save favorites & create your own prompts",
                "Priority new prompts every week",
                "Cancel anytime",
              ].map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand">✓</span>
                  {i}
                </li>
              ))}
            </ul>
            <FreemiusCheckout className="mt-8 block w-full rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-medium text-white hover:opacity-90">
              Get Pro — $10/mo
            </FreemiusCheckout>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Prompt smarter, starting today
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Join the workflow that turns ChatGPT and Claude into a team of
            experts.
          </p>
          <Link
            href="/#extension"
            className="mt-8 inline-block rounded-lg bg-brand px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            Get PromptDeck — $10/mo
          </Link>
        </div>
      </section>
    </div>
  );
}
