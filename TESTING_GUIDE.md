# Testing Guide - Intone

This guide will help you set up and test the Intone application.

## Prerequisites

Before testing, ensure you have:
- Node.js 18+ installed
- npm or yarn installed
- A Neon Postgres database (or any Postgres database)
- Google OAuth credentials (for authentication)
- OpenAI API key (optional for initial testing)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database (Neon Postgres)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth.js
NEXTAUTH_SECRET="generate-this-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI (optional - user can add their own key)
OPENAI_API_KEY="sk-your-openai-api-key"
```

#### Generating NEXTAUTH_SECRET

On macOS/Linux:
```bash
openssl rand -base64 32
```

On Windows (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

### 3. Set Up Database

#### Option A: Neon Postgres (Recommended)

1. Sign up at [Neon](https://neon.tech/)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in your `.env` file

#### Option B: Local Postgres

1. Install Postgres locally
2. Create a database:
   ```sql
   CREATE DATABASE intone;
   ```
3. Update `DATABASE_URL` in your `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/intone?schema=public"
   ```

### 4. Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run migrations to create database schema
npm run db:migrate

# Seed rule definitions (tone and grammar rules)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The app should start at [http://localhost:3000](http://localhost:3000)

## Testing the Application

### 1. Landing Page

- Visit `http://localhost:3000`
- Verify the landing page displays correctly
- Test theme toggle (light/dark mode)
- Check navigation links work

### 2. Authentication Flow

#### Sign Up
- Click "Sign up" button
- Sign in with Google
- After authentication, you should be redirected to `/app/dashboard`
- A default organization should be created automatically

#### Login
- Click "Login" button
- Sign in with Google
- Should redirect to dashboard if already authenticated

### 3. Brand Creation

- From the dashboard, click "Create a brand"
- Fill in:
  - Brand name (e.g., "Acme Inc")
  - Slug will auto-generate
  - Select language/locale
  - Choose starting template
- Click "Create brand"
- Should redirect to tone onboarding wizard

### 4. Tone Onboarding Wizard

- Complete the 8-step onboarding flow:
  1. **Language and Locale** - Select your locale
  2. **Formality** - Choose formal/neutral/conversational
  3. **Confidence** - Select assertive/balanced/careful
  4. **Directness** - Choose direct/neutral/expressive
  5. **Personality Constraints** - Toggle exclusions (humor, slang, emojis, etc.)
  6. **Sentence Behavior** - Configure sentence preferences
  7. **UI-Specific Tone** - Set UI writing rules
  8. **Summary** - Review and test tone
- Verify progress is saved at each step
- Test the "Test this tone" feature in the summary step (requires OpenAI API key)

### 5. Tone Rules Settings

- After onboarding, you'll land on the tone rules settings page
- Verify all configured rules are displayed
- Toggle rules on/off
- Verify rule descriptions and examples are shown

### 6. Grammar Rules

- Navigate to "Grammar and punctuation" in the sidebar
- Verify grammar rules are listed
- Toggle rules on/off
- Check rule descriptions and examples

### 7. Editor (Rewrite/Lint)

- Navigate to "Editor" in the sidebar (under a brand)
- Test **Rewrite mode**:
  - Enter some text
  - Select context (UI, Marketing, Support)
  - Click "Rewrite"
  - Verify output appears with explanations
  - Check rule explanations show changes
- Test **Lint mode**:
  - Switch to "Lint" tab
  - Enter text that might violate rules
  - Click "Lint"
  - Verify issues are identified with severity levels

**Note**: Editor features require an OpenAI API key. If not configured, you'll see an error message.

### 8. Theme Testing

- Test theme toggle in header/sidebar
- Verify:
  - Light mode works correctly
  - Dark mode works correctly
  - System theme detection works
  - Theme preference persists on page refresh

### 9. Navigation

- Test sidebar navigation
- Verify:
  - All menu items are accessible
  - "Coming soon" items show proper placeholders
  - Brand selector works
  - Settings page accessible

### 10. Coming Soon Pages

- Navigate to:
  - Terminology
  - Assets
  - Sources
  - Integrations
- Verify "Coming soon" placeholder displays

## Troubleshooting

### Database Connection Issues

```bash
# Verify database connection
npm run db:studio
# This opens Prisma Studio where you can view/edit data
```

### Migration Issues

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Authentication Issues

- Verify Google OAuth credentials are correct
- Check redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- Clear browser cookies/localStorage if authentication fails

### OpenAI API Issues

- Verify API key is valid
- Check API usage limits
- Ensure API key has proper permissions
- Check browser console for error messages

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Regenerate Prisma client
npm run db:generate
```

## Testing Checklist

- [ ] Landing page loads correctly
- [ ] Theme toggle works (light/dark/system)
- [ ] Google OAuth sign up works
- [ ] Google OAuth login works
- [ ] Default organization created on first sign in
- [ ] Brand creation works
- [ ] Tone onboarding wizard completes successfully
- [ ] Tone rules settings page displays rules
- [ ] Grammar rules page displays rules
- [ ] Editor rewrite mode works (with API key)
- [ ] Editor lint mode works (with API key)
- [ ] Rule toggling works
- [ ] Navigation works correctly
- [ ] "Coming soon" pages show placeholders
- [ ] Settings page accessible
- [ ] Sign out works

## Quick Test Script

```bash
# Complete setup and start
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Then visit:
1. http://localhost:3000 - Landing page
2. Sign up with Google
3. Create a brand
4. Complete tone onboarding
5. Test editor with sample text

## API Testing

You can also test API endpoints directly using curl or Postman:

```bash
# Get user's organizations
curl http://localhost:3000/api/orgs \
  -H "Cookie: your-session-cookie"

# Get brands
curl http://localhost:3000/api/brands \
  -H "Cookie: your-session-cookie"

# Get rule definitions
curl http://localhost:3000/api/rule-definitions
```

## Need Help?

- Check the [README.md](README.md) for general information
- Review [CODING_GUIDELINES.md](CODING_GUIDELINES.md) for development standards
- Check browser console for errors
- Review server logs in terminal

