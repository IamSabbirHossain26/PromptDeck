import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 7l6-3 6 3v10l-6 3-6-3V7z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 4v10l6 3M10 14l-6 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg">PromptDeck</span>
    </Link>
  );
}
