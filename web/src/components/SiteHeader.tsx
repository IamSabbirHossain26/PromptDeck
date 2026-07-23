import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href="/library" className="hover:text-foreground">
            Prompt Library
          </Link>
          <Link href="/#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/#pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/#extension" className="hover:text-foreground">
            Get Extension
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/library"
            className="hidden text-sm text-muted hover:text-foreground sm:block"
          >
            Browse
          </Link>
          <Link
            href="/#pricing"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Start for $10/mo
          </Link>
        </div>
      </div>
    </header>
  );
}
