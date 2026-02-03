<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Prisma-7-2d3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<h1 align="center">Intone</h1>
<p align="center">
  <strong>A design language for copy.</strong>
</p>
<p align="center">
  Define, enforce, and scale your brand’s tone of voice, grammar, and writing conventions.
</p>
<p align="center">
  <a href="https://github.com/deepdesign/intone">GitHub</a> · <a href="#getting-started">Getting Started</a> · <a href="#features">Features</a> · <a href="#project-structure">Structure</a>
</p>

---

## About

**Intone** is a brand language and tone governance platform. It helps product, marketing, and support teams keep all customer-facing and internal copy consistent with defined rules — tone, grammar, numbers, terminology, and assets — and provides AI-powered rewrite and generation with those rules applied.

### Who it’s for

- **Product teams** — Keep UI copy, onboarding, and in-app messaging on-brand.
- **Marketing** — Align campaigns, landing pages, and emails with voice and terminology.
- **Support & ops** — Standardise replies, docs, and internal comms.
- **Multi-brand orgs** — Manage separate rule sets and assets per brand with slug-based URLs and optional theming.

### What it does

- **Tone of voice** — Configure formality, confidence, directness, enthusiasm, humour, and personality via an onboarding wizard and sliders; rules drive copy style and AI rewrites.
- **Grammar & punctuation** — Enforce Oxford comma, capitals, hyphenation, and other style choices; get explanations when rules are applied.
- **Numbers & values** — Standardise dates, currencies, units, and rounding so copy is consistent (e.g. “£1,234.56” vs “1234.56 GBP”).
- **Terminology** — Preferred terms, forbidden words, and snippets so everyone uses the same language.
- **Repository** — Ingest copy (upload or paste), cluster similar chunks, surface conflicts, and approve canonical versions for grounding.
- **Create** — Rewrite or generate copy with brand rules applied via OpenAI (user-provided API key).
- **Assets** — Store brand colors, fonts, and logos; optional dynamic theming per brand.
- **Audit** — Run copy through rules and see where it passes or fails.

---

## Tech stack

| Layer      | Technology | Notes |
| ---------- | ---------- | ----- |
| Framework  | Next.js 16 | App Router, server components, API routes |
| Language   | TypeScript 5.9 | Strict typing |
| UI         | React 19, Tailwind CSS 4, shadcn/ui (Radix) | Theming via CSS variables (oklch) |
| Auth       | Auth.js (NextAuth v5) | Google OAuth; session + org/brand access |
| Database   | PostgreSQL (Neon) + Prisma 7 | Migrations, seed for rule definitions |
| AI         | OpenAI API | User-provided key; rewrite/generate in Create |

---

## Getting started

### Prerequisites

- **Node.js** 18 or later
- **PostgreSQL** — e.g. [Neon](https://neon.tech) (free tier works)
- **Google OAuth** — [Google Cloud Console](https://console.cloud.google.com): create OAuth 2.0 credentials, add redirect URI `http://localhost:3000/api/auth/callback/google`
- **OpenAI API key** (optional) — Required only for the Create (rewrite/generate) feature

### 1. Clone and install

```bash
git clone https://github.com/deepdesign/intone.git
cd intone
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and fill in your values. **Never commit `.env` or real credentials** — it is gitignored; only `.env.example` (placeholders) is tracked. If you ever exposed an API key (e.g. by committing it), revoke it immediately in the provider’s dashboard, create a new key, and put the new key only in `.env`. See [SECURITY.md](SECURITY.md).

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes | Postgres connection string (e.g. Neon: project → Connection string) |
| `NEXTAUTH_SECRET` | Yes | Random secret for session encryption; generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | App URL; use `http://localhost:3000` for local dev |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `OPENAI_API_KEY` | No | OpenAI API key; only needed for Create (rewrite/generate) |

Example `.env`:

```env
DATABASE_URL="postgresql://user:password@host.region.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
OPENAI_API_KEY="sk-..."
```

### 3. Database

Generate the Prisma client, run migrations, and seed rule definitions (tone, grammar, numbers):

```bash
npm run db:generate   # Prisma client
npm run db:migrate    # Creates/updates DB schema
npm run db:seed       # Seeds rule definitions
```

### 4. Run

```bash
npm run dev
```

Open **http://localhost:3000**. Sign in with Google, complete onboarding (create an org and brand), then you can configure rules, use Create, and manage the repository.

---

## Features (detailed)

| Area | What you can do |
| ---- | ----------------- |
| **Brands** | Create multiple brands; URLs use slugs (e.g. `/brands/acme/create`). Each brand has its own rules, assets, repository, and optional theme (colors from Assets). |
| **Tone of voice** | Run the onboarding wizard (formality, confidence, directness, enthusiasm, humour, etc.) or adjust sliders in Settings. Rules feed into prompts for rewrite/generate and lint. |
| **Grammar & punctuation** | Enable/configure built-in rules (e.g. Oxford comma, capitalisation); add custom rules. Test input against rules and see explanations. |
| **Numbers & values** | Configure date format, currency, units, and rounding. Rules apply to generated/rewritten copy. |
| **Terminology** | Preferred terms (use X not Y), forbidden words, snippets. Used in lint and Create. |
| **Snippets** | Store phrase variants per brand; reference in rules and copy. |
| **Custom rules** | Add and edit custom rules per brand (name, description, category, examples). |
| **Repository** | Ingest copy via file upload or paste; chunks are normalised, embedded, and classified. View clusters and conflicts; mark canonical chunks; use for grounding. |
| **Assets** | Add colors, fonts, logos per brand. Colors can drive optional brand theming (CSS variables). |
| **Create** | Paste or type copy; rewrite or generate with brand rules applied (OpenAI). Output can be approved/rejected for the repository. |
| **Audit** | Run copy through the brand’s rules and see pass/fail and explanations. |
| **Learn** | Guided flows for tone onboarding and rule setup. |

---

## Project structure

```
intone/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # NextAuth, signout, force-signout
│   │   ├── brands/             # List/create brands
│   │   └── brands/[brandSlug]/ # Brand-scoped: route, rewrite, lint, audit,
│   │                           # rules, terminology, snippets, repository,
│   │                           # assets, learn
│   ├── app/                    # Authenticated app shell
│   │   ├── layout.tsx          # Sidebar, header, breadcrumbs
│   │   ├── dashboard/
│   │   └── settings/
│   ├── brands/
│   │   ├── new/                # New brand flow
│   │   └── [brandSlug]/        # Brand-scoped pages
│   │       ├── layout.tsx      # Brand layout, theme provider
│   │       ├── create/         # Rewrite/generate
│   │       ├── repository/     # Chunks, clusters, conflicts
│   │       ├── assets/         # Colors, fonts, logos
│   │       ├── audit/
│   │       └── rules/          # Overview, tone, grammar, numbers,
│   │                           # terminology, custom, snippets, assets
│   ├── login/
│   ├── onboarding/
│   ├── signup/
│   ├── layout.tsx
│   └── page.tsx                # Landing
├── components/
│   ├── ui/                     # shadcn/ui (Button, Card, Input, etc.)
│   ├── app-sidebar.tsx         # Main nav, brand selector
│   ├── app-breadcrumbs.tsx
│   ├── site-header.tsx
│   ├── sidebar/                # Brand selector, nav
│   ├── rules/                  # Rule UIs, test input, secondary nav
│   ├── create/                 # Create panel (input/output, actions)
│   ├── assets/                 # Color/font/logo forms and lists
│   ├── audit/
│   └── ...
├── lib/
│   ├── db.ts                   # Prisma client
│   ├── auth.ts                 # getCurrentUser, hasBrandAccess
│   ├── brands.ts               # resolveBrandSlugToId (slug → ID + access)
│   ├── ai/                     # OpenAI client, response parsing
│   ├── rules/                  # Definitions, evaluator, prompt builder
│   ├── repository/             # Chunking, embedding, clustering, etc.
│   └── ...
├── prisma/
│   ├── schema.prisma           # Models: User, Org, Brand, rules, chunks, etc.
│   ├── seed.ts
│   └── seed/rules/              # Tone, grammar, numbers rule definitions
├── scripts/
│   ├── setup-env.js            # Interactive .env setup
│   ├── check-code-hygiene.ts   # Code quality checks
│   └── ...
├── .env.example                # Template; never commit .env
├── .gitignore
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## Architecture (brief)

- **Brand identification** — Public URLs use `brandSlug` (e.g. `acme`). API and server code resolve slug to internal `brandId` and check access via `hasBrandAccess(user, brandId)`.
- **Auth** — Auth.js (NextAuth v5) with Google OAuth; sessions include user and org membership. Brand access is enforced in API routes and server components.
- **Rules** — Stored in DB; seed adds default tone/grammar/numbers rules. Evaluator and prompt builder apply them for lint, rewrite, and generate.
- **Repository** — Ingested text is chunked, embedded (OpenAI), and optionally classified. Clustering and conflict detection help maintain a single source of truth; approved copy can be used for grounding.
- **Theming** — Optional per-brand theme: brand colors from Assets are mapped to CSS variables (e.g. `--primary`) in `BrandThemeProvider` so the UI can reflect brand identity.

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations (interactive; dev only) |
| `npm run db:deploy` | Run migrations in production (non-interactive) |
| `npm run db:seed` | Seed rule definitions |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run check:hygiene` | Run code hygiene checks (see CODE_HYGIENE_CHECKLIST.md) |
| `npm run setup:env` | Interactive .env setup (Node script) |

On the VPS, after first-time setup, run `./scripts/deploy-vps.sh` from the project root to pull, build, and restart (see [DEPLOY_VPS.md](DEPLOY_VPS.md)).

---

## Documentation

- [QUICK_START.md](QUICK_START.md) — Short setup guide  
- [TESTING_GUIDE.md](TESTING_GUIDE.md) — How to test the app  
- [DEPLOY_VPS.md](DEPLOY_VPS.md) — Deploy to a VPS (e.g. Hostinger)  
- [CODE_HYGIENE_CHECKLIST.md](CODE_HYGIENE_CHECKLIST.md) — Code quality and structure checklist  
- [.env.example](.env.example) — Environment variable template  

---

## Deployment

- **VPS (e.g. Hostinger)** — See [DEPLOY_VPS.md](DEPLOY_VPS.md). Production URL: `https://intone.jamescutts.me`; set `NEXTAUTH_URL` and Google OAuth redirect URI accordingly.
- **Vercel** — Connect the repo; set env vars in Project Settings (same as `.env`). Use Neon (or another Postgres) and set `NEXTAUTH_URL` to your app URL.
- **Other hosts** — Build with `npm run build`, run `npm run start`. Set all env vars; run migrations (e.g. `npx prisma migrate deploy`) and optionally seed.

---

## License

MIT · [**deepdesign/intone**](https://github.com/deepdesign/intone)
