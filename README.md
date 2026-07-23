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
- ✅ 504 curated prompts across 15 categories, all in RTF (Role–Task–Format) structure
- ✅ Prompts stored in **PostgreSQL** (Hostinger, remote) with a JSON fallback so the site works before the DB is wired
- ✅ **Admin dashboard** at `/admin` — full CRUD over the prompt library (password-protected)
- ✅ Freemius checkout wired on the pricing page (set env keys to go live — see below)

### Database + Admin setup (Hostinger PostgreSQL)

1. In Hostinger hPanel → **Databases → PostgreSQL**: create a database + user, then enable **Remote access** for your deploy host/IP.
2. `cp web/.env.local.example web/.env.local` and fill in:
   - `DATABASE_URL=postgres://user:pass@host:5432/dbname` (Hostinger uses SSL — leave `DATABASE_SSL` unset)
   - `ADMIN_PASSWORD` and `ADMIN_SECRET` (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
3. Create the table and import all 504 prompts:
   ```bash
   cd web
   npm run db:setup   # creates the prompts table
   npm run db:seed    # imports prompts.json into the DB (idempotent upsert)
   ```
4. Visit **`/admin`**, log in, and create/edit/delete prompts. Changes are live immediately at `/api/prompts`, `/library`, and (via the API URL) the extension.

**How reads work:** with `DATABASE_URL` set, the site reads prompts from Postgres. Without it, it falls back to the bundled `prompts.json` (read-only). `prompts.json` stays the seed source and the offline copy the extension bundles.

### Freemius payments setup

1. Create a free account at [freemius.com](https://freemius.com) → add a product (type: SaaS) → create a $10/mo plan
2. Copy `web/.env.local.example` → `web/.env.local` and fill in:
   - `NEXT_PUBLIC_FREEMIUS_PRODUCT_ID` and `NEXT_PUBLIC_FREEMIUS_PUBLIC_KEY` (Settings → Keys)
   - `FREEMIUS_SECRET_KEY` (server-side, for webhook verification)
3. In the Freemius dashboard, point the webhook to `https://YOUR-DOMAIN/api/freemius/webhook`
4. The "Get Pro" button then opens the Freemius checkout overlay; until keys are set it falls back to a contact link
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
