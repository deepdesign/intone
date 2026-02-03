#!/usr/bin/env bash
# Run this on the VPS from the project root: ./scripts/deploy-vps.sh
# First time: create .env and run db:seed manually, then run this script.
set -e

echo "==> Pulling latest..."
git pull

echo "==> Installing dependencies (legacy-peer-deps for react-shaders)..."
npm ci

echo "==> Prisma generate..."
npm run db:generate

echo "==> Running migrations..."
npm run db:deploy

echo "==> Building..."
npm run build

echo "==> Restarting app (PM2)..."
if command -v pm2 &> /dev/null; then
  pm2 restart intone --update-env || pm2 start npm --name "intone" -- start
  pm2 save
  echo "Done. App restarted with PM2."
else
  echo "PM2 not found. Run: npm run start (or install PM2 and run pm2 start npm --name intone -- start)"
  exit 1
fi
