#!/usr/bin/env node

/**
 * Helper script to set up .env file
 * Usage: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const envPath = path.join(process.cwd(), '.env');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('\n🔧 Environment Setup\n');
  console.log('This script will help you set up your .env file.\n');

  // Check if .env exists
  let existingEnv = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^#=]+)=(.+)$/);
      if (match) {
        existingEnv[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
    console.log('📄 Found existing .env file\n');
  }

  const env = { ...existingEnv };

  // Database URL
  if (!env.DATABASE_URL || env.DATABASE_URL.includes('localhost')) {
    console.log('📦 Database Setup:');
    console.log('   Get your Neon connection string from: https://console.neon.tech');
    console.log('   Or use: postgresql://user:password@host:port/database\n');
    env.DATABASE_URL = await question(`DATABASE_URL [${env.DATABASE_URL || 'not set'}]: `) || env.DATABASE_URL;
  } else {
    console.log(`✅ DATABASE_URL: ${env.DATABASE_URL.substring(0, 30)}...`);
  }

  // NextAuth Secret
  if (!env.NEXTAUTH_SECRET) {
    // Generate a new secret using crypto
    const crypto = require('crypto');
    env.NEXTAUTH_SECRET = crypto.randomBytes(32).toString('base64');
    console.log(`✅ NEXTAUTH_SECRET: Generated`);
  } else {
    console.log(`✅ NEXTAUTH_SECRET: Already set`);
  }

  // NextAuth URL
  env.NEXTAUTH_URL = env.NEXTAUTH_URL || 'http://localhost:3000';
  console.log(`✅ NEXTAUTH_URL: ${env.NEXTAUTH_URL}`);

  // Google OAuth
  if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.includes('your-')) {
    console.log('\n🔐 Google OAuth Setup:');
    console.log('   Get credentials from: https://console.cloud.google.com/');
    console.log('   Redirect URI: http://localhost:3000/api/auth/callback/google\n');
    env.GOOGLE_CLIENT_ID = await question(`GOOGLE_CLIENT_ID [${env.GOOGLE_CLIENT_ID || 'not set'}]: `) || env.GOOGLE_CLIENT_ID;
    env.GOOGLE_CLIENT_SECRET = await question(`GOOGLE_CLIENT_SECRET [${env.GOOGLE_CLIENT_SECRET || 'not set'}]: `) || env.GOOGLE_CLIENT_SECRET;
  } else {
    console.log(`✅ GOOGLE_CLIENT_ID: Set`);
    console.log(`✅ GOOGLE_CLIENT_SECRET: Set`);
  }

  // OpenAI Key
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.includes('your-')) {
    env.OPENAI_API_KEY = await question(`OPENAI_API_KEY [optional, press Enter to skip]: `) || '';
    if (env.OPENAI_API_KEY) {
      console.log(`✅ OPENAI_API_KEY: Set`);
    } else {
      console.log(`⚠️  OPENAI_API_KEY: Not set (AI features will be disabled)`);
    }
  } else {
    console.log(`✅ OPENAI_API_KEY: Already set`);
  }

  // Write .env file
  const envContent = `# Database
DATABASE_URL="${env.DATABASE_URL}"

# NextAuth.js
NEXTAUTH_SECRET="${env.NEXTAUTH_SECRET}"
NEXTAUTH_URL="${env.NEXTAUTH_URL}"

# Google OAuth
GOOGLE_CLIENT_ID="${env.GOOGLE_CLIENT_ID}"
GOOGLE_CLIENT_SECRET="${env.GOOGLE_CLIENT_SECRET}"

# OpenAI
OPENAI_API_KEY="${env.OPENAI_API_KEY}"
`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created/updated successfully!\n');

  rl.close();
}

setup().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});

