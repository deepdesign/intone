# Quick Start Guide

Get Intone running in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment

Create `.env` file:

```env
DATABASE_URL="your-postgres-connection-string"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="from-google-console"
GOOGLE_CLIENT_SECRET="from-google-console"
OPENAI_API_KEY="sk-optional-for-testing"
```

## 3. Initialize Database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## 4. Start Development Server

```bash
npm run dev
```

## 5. Open Browser

Visit [http://localhost:3000](http://localhost:3000)

## What to Test

1. **Sign up** with Google OAuth
2. **Create a brand** from dashboard
3. **Complete tone onboarding** (8 steps)
4. **Test editor** with sample text

## Need Help?

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed instructions.

