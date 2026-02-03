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
  <a href="https://github.com/deepdesign/intone">GitHub</a> · <a href="#getting-started">Getting Started</a> · <a href="#features">Features</a>
</p>

---

## About

**Intone** is a brand language and tone governance platform. It helps teams keep product UI, marketing, support, and internal communications consistent with defined rules for tone, grammar, numbers, terminology, and assets.

- **Tone of voice** — Set formality, confidence, directness, and personality; get copy that matches.
- **Grammar & punctuation** — Enforce style (e.g. Oxford comma, capitals) and get explanations.
- **Numbers & values** — Standardise dates, currencies, and units across all copy.
- **Terminology** — Preferred terms, forbidden words, and snippets.
- **Repository** — Ingest and manage copy; classify and resolve conflicts.
- **Create** — Rewrite or generate copy with brand rules applied via AI (OpenAI).

---

## Tech stack

| Layer      | Technology |
| ---------- | ---------- |
| Framework  | Next.js 16 (App Router) |
| Language   | TypeScript 5.9 |
| UI         | React 19, Tailwind CSS 4, shadcn/ui (Radix) |
| Auth       | Auth.js (NextAuth v5) with Google OAuth |
| Database   | PostgreSQL (Neon) with Prisma 7 |
| AI         | OpenAI API (user-provided key) |

---

## Getting started

### Prerequisites

- **Node.js** 18+
- **Postgres** (e.g. [Neon](https://neon.tech))
- **Google OAuth** credentials ([Google Cloud Console](https://console.cloud.google.com))
- **OpenAI API key** (optional for testing)

### 1. Clone and install

```bash
git clone https://github.com/deepdesign/intone.git
cd intone
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and fill in your values. **Never commit `.env` or real credentials** — it is gitignored; only `.env.example` (placeholders) is tracked.

Create or edit `.env` in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/intone?sslmode=require"

# Auth (NextAuth.js v5)
NEXTAUTH_SECRET="openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI (optional; for Create / rewrite features)
OPENAI_API_KEY="sk-..."
```

### 3. Database

```bash
npm run db:generate   # Prisma client
npm run db:migrate    # Run migrations
npm run db:seed       # Seed rule definitions
```

### 4. Run

```bash
npm run dev
```

Open **http://localhost:3000** — sign in with Google and create a brand to start.

---

## Features

| Area | Capabilities |
| ---- | ------------- |
| **Brands** | Multi-brand; slug-based URLs; brand-specific themes and assets |
| **Tone** | Onboarding wizard, sliders (formality, confidence, etc.), rule-driven copy |
| **Grammar** | Punctuation and style rules with explanations |
| **Numbers** | Dates, currencies, units, and rounding conventions |
| **Terminology** | Preferred terms, forbidden words, snippets |
| **Custom rules** | Add and edit custom rules per brand |
| **Repository** | Ingest copy (file upload or paste), clusters, conflicts, approval |
| **Assets** | Colors, fonts, logos with brand theming |
| **Create** | Rewrite or generate copy with brand rules (OpenAI) |
| **Audit** | Audit copy against brand rules |

---

## Project structure

```
intone/
├── app/
│   ├── api/              # API routes (auth, brands, rewrite, audit, …)
│   ├── app/              # Authenticated app shell (sidebar, header, breadcrumbs)
│   ├── brands/[brandSlug]/  # Brand-scoped: create, repository, assets, rules
│   ├── login/
│   └── ...
├── components/
│   ├── ui/               # shadcn/ui
│   ├── sidebar/          # App sidebar, brand selector
│   ├── rules/            # Rule UIs, test input, secondary nav
│   ├── create/           # Create panel (rewrite/generate)
│   ├── assets/           # Colors, fonts, logos
│   └── ...
├── lib/
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # getCurrentUser, hasBrandAccess
│   ├── brands.ts         # resolveBrandSlugToId, etc.
│   ├── ai/               # OpenAI helpers
│   └── ...
├── prisma/
│   ├── schema.prisma
│   └── seed/
└── scripts/              # DB seed, hygiene check, etc.
```

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed rule definitions |
| `npm run db:studio` | Open Prisma Studio |
| `npm run check:hygiene` | Run code hygiene checks |

---

## Docs

- [QUICK_START.md](QUICK_START.md) — Short setup guide  
- [TESTING_GUIDE.md](TESTING_GUIDE.md) — Testing instructions  
- [CODE_HYGIENE_CHECKLIST.md](CODE_HYGIENE_CHECKLIST.md) — Code quality checklist  

---

## License

MIT · [**deepdesign/intone**](https://github.com/deepdesign/intone)
