# Google OAuth Setup - Step by Step

## Quick Guide

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create/Select Project**:
   - Click project dropdown at top
   - Click "New Project"
   - Name it "intone" (or anything)
   - Click "Create"

3. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (for testing)
   - Fill in required fields:
     - App name: "Intone"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip scopes (click "Save and Continue")
   - Add test users if needed (your email)
   - Click "Save and Continue"

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Intone Dev"
   - **Authorized redirect URIs**: 
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click "Create"

5. **Copy Credentials**:
   - Copy the Client ID
   - Copy the Client Secret
   - Provide them to me to add to .env

---

**Alternative**: If you already have Google OAuth credentials from another project, you can reuse them by adding the redirect URI above.

