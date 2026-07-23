import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted">
              Your cheat code for ChatGPT & Claude. Curated prompts, one click
              away — right inside the chat.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-medium">Product</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <Link href="/library" className="hover:text-foreground">
                    Prompt Library
                  </Link>
                </li>
                <li>
                  <Link href="/#extension" className="hover:text-foreground">
                    Browser Extension
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Company</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <Link href="/#features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <a href="mailto:hello@promptdeck.app" className="hover:text-foreground">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Legal</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <Link href="/#" className="hover:text-foreground">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/#" className="hover:text-foreground">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-foreground">
                    Admin
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted">
          © {new Date().getFullYear()} PromptDeck. Not affiliated with OpenAI or
          Anthropic. ChatGPT and Claude are trademarks of their respective
          owners.
        </div>
      </div>
    </footer>
  );
}
