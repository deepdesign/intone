# Setup Instructions - Complete These Steps

## ✅ Already Done
- Prisma client generated
- Dependencies installed
- OpenAI API key provided
- NEXTAUTH_SECRET generated

## 🔄 Steps You Need to Complete

### Step 1: Neon Database Setup (5 minutes)

1. **Sign up for Neon** (if you haven't already):
   - Go to: https://console.neon.tech/signup
   - Click "Sign Up with Google" (since you have a Google account)
   - Complete the sign-up process

2. **Create a Project**:
   - After signing in, click "Create a project"
   - Give it a name (e.g., "intone")
   - Choose a region (closest to you)
   - Click "Create project"

3. **Get Connection String**:
   - Once your project is created, you'll see the dashboard
   - Look for the **"Connection string"** section
   - Click "Copy" next to the connection string
   - It will look like:
     ```
     postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

4. **Add to .env**:
   - Paste the connection string into your `.env` file as `DATABASE_URL`

**Once you have the connection string, let me know and I'll continue with the setup!**

---

### Step 2: Google OAuth Setup (5 minutes)

While you're setting up Neon, here's how to get Google OAuth credentials:

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**:
   - Create a new project (or select an existing one)
   - Give it a name (e.g., "intone")

3. **Enable APIs**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
   - Or search for "People API" and enable it

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen first (choose "External")
   - Application type: **Web application**
   - Name: "Intone Development" (or any name)
   - Authorized redirect URIs: Add this EXACTLY:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click "Create"

5. **Copy Credentials**:
   - Copy the **Client ID** (looks like: `xxx.apps.googleusercontent.com`)
   - Copy the **Client Secret**
   - Add both to your `.env` file

**Once you have the Google OAuth credentials, I can help you add them to .env**

---

## 🎯 What I'll Do Once You Have These

Once you provide:
1. ✅ Neon connection string
2. ✅ Google OAuth Client ID
3. ✅ Google OAuth Client Secret

I will:
- Update your `.env` file
- Run database migrations
- Seed the database with rule definitions
- Start the development server
- Verify everything works

---

## Quick Checklist

- [ ] Neon account created
- [ ] Neon project created
- [ ] Neon connection string copied
- [ ] Google Cloud project created
- [ ] Google OAuth credentials created
- [ ] Connection string added to .env
- [ ] Google credentials added to .env

**Let me know when you have the Neon connection string, and we'll continue!**

