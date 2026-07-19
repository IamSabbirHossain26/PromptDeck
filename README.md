# PromptDeck

Your cheat code for ChatGPT & Claude — a curated, one-click prompt library that
lives **inside** the AI chat, plus a marketing site and prompt browser. An
open, lower-cost alternative to AIPRM.

```
copy of aiprm/
├── web/                 Next.js 16 marketing site + prompt library + API
│   └── src/data/prompts.json   ← single source of truth for all prompts
├── extension/           Chrome MV3 extension (injects the panel into ChatGPT/Claude)
└── scripts/sync-prompts.mjs    Copies prompts.json into the extension bundle
```

## Run the web app

```bash
cd web
npm install      # already done during scaffold
npm run dev      # http://localhost:3000
```

Pages:
- `/` — landing page (hero, features, how-it-works, pricing)
- `/library` — searchable, filterable prompt library with copy + preview
- `/api/prompts` — public JSON the extension syncs from (CORS-open)

## Load the Chrome extension

1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked** → select the `extension/` folder
4. Open [chatgpt.com](https://chatgpt.com) or [claude.ai](https://claude.ai)
5. The PromptDeck panel appears bottom-right. Click a prompt → it drops into the composer.

By default the extension uses its **bundled** `prompts.json`. To sync from your
live site, click the extension icon and set the API URL to
`https://YOUR-DOMAIN/api/prompts`.

## Add or edit prompts

Edit `web/src/data/prompts.json`, then run:

```bash
node scripts/sync-prompts.mjs
```

This validates the JSON and copies it into the extension. Restart the ChatGPT/Claude
tab to see changes.

## Path to launch (what's built vs. what to wire up)

**Built and working now:**
- ✅ Marketing site + pricing
- ✅ 79 curated, variable-driven prompts across 13 categories
- ✅ Searchable/filterable library with copy & preview
- ✅ Public prompt API
- ✅ Chrome extension that injects prompts into ChatGPT **and** Claude

**To turn on billing & accounts (needs your keys — external services):**
- **Auth + database:** [Supabase](https://supabase.com) free tier — user accounts,
  favorites, "own" prompts. Add `@supabase/supabase-js` and wire login.
- **Payments ($10/mo):** [Stripe](https://stripe.com) Checkout + a webhook route
  at `web/src/app/api/stripe/webhook/route.ts` to flip a user to "Pro".
- **Gate Pro prompts:** the extension checks a signed token from your API before
  showing Pro-only prompts.

**Deploy:**
- Web: push `web/` to GitHub → import into [Vercel](https://vercel.com) (free, built-in CDN).
- Extension: zip the `extension/` folder → submit to the Chrome Web Store
  ($5 one-time developer fee).

## Legal note

Not affiliated with OpenAI or Anthropic. The extension only injects text into the
input box on pages the user opens; it doesn't scrape or automate accounts.
