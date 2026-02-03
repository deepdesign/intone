# Setup Helper - Environment Variables

## Database Options

### Option 1: Neon Postgres (Recommended - Free & Easy)

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for free
3. Create a new project
4. Copy the connection string (it will look like: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`)
5. Add it to your `.env` file as `DATABASE_URL`

### Option 2: Local Postgres

1. Install Postgres locally
2. Create a database:
   ```sql
   CREATE DATABASE intone;
   ```
3. Use connection string:
   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/intone?schema=public"
   ```

### Option 3: Supabase (Alternative Cloud Option)

1. Go to [https://supabase.com](https://supabase.com)
2. Create a free project
3. Get the connection string from Settings > Database
4. Add to `.env` as `DATABASE_URL`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env`

## OpenAI API Key (Optional for Testing)

You can test the app without OpenAI, but editor features won't work. Get a key from:
- [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

## Complete .env Template

```env
# Database (replace with your connection string)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# NextAuth.js (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# OpenAI (optional - can test without this)
OPENAI_API_KEY="sk-your-api-key-here"
```

