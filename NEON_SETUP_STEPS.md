# Neon Database Setup Steps

## Step 1: Create Neon Account and Project

1. Go to **https://neon.tech**
2. Click **"Sign Up"** (you can use your Google account)
3. After signing up, click **"Create a project"**
4. Choose a project name (e.g., "intone")
5. Select a region close to you
6. Click **"Create project"**

## Step 2: Get Connection String

1. Once your project is created, you'll see a dashboard
2. Look for **"Connection string"** section
3. You'll see something like:
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Click **"Copy"** to copy the connection string
5. **Paste it here** when ready, or I can help you add it to .env

## Step 3: Add to .env

The connection string will be added to your `.env` file as `DATABASE_URL`.

---

**Let me know when you have the Neon connection string, and I'll help you complete the setup!**

