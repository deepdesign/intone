# Quick Testing Guide

## ✅ Setup Complete

Your environment is configured with:
- ✅ Database: Neon Postgres (migrated)
- ✅ Google OAuth credentials
- ✅ OpenAI API key
- ✅ NextAuth secret

## 🚀 Start Testing

The dev server should be starting. Once it's ready:

1. **Open your browser**: http://localhost:3000

2. **Test the landing page**:
   - Should display the Intone landing page
   - Theme toggle should work (top right)

3. **Sign up/Login**:
   - Click "Sign up" or "Login"
   - Sign in with Google
   - You'll be redirected to `/app/dashboard`
   - A default organization will be created automatically

4. **Create a Brand**:
   - Click "Create a brand" from dashboard
   - Fill in brand name, select locale and template
   - Click "Create brand"
   - You'll be redirected to the tone onboarding wizard

5. **Complete Tone Onboarding**:
   - Go through the 8-step wizard
   - Each step saves automatically
   - On the summary page, you can test the tone (requires OpenAI API key)

6. **Test Editor**:
   - Navigate to Editor in the sidebar
   - Try rewriting some text
   - Switch to Lint mode to check for issues

## ⚠️ Known Issue

The database seed script (`npm run db:seed`) is currently failing due to Prisma 7 requiring an adapter. This doesn't affect the app functionality - you can still:
- Create brands
- Configure tone rules through the onboarding wizard
- Use the editor

The seed script would have populated some default rule definitions, but the onboarding wizard will create rule instances as you configure them.

## 🔧 If Server Isn't Running

If you need to restart the server:

```bash
npm run dev
```

## 📝 Full Testing Guide

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing instructions.

