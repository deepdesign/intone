# Deploy Intone to a VPS (e.g. Hostinger)

Use this when deploying to a VPS such as Hostinger. The app runs as a Node.js process behind a reverse proxy (nginx) with HTTPS.

## Directory layout (subdomain, not root)

Serve **intone.jamescutts.me** from its own directory so it is separate from the server root (e.g. your main site at jamescutts.me).

**On the VPS:**

- Put the app in a directory dedicated to the subdomain, for example:
  - `/var/www/intone.jamescutts.me` (common on shared/VPS), or
  - `/home/youruser/intone.jamescutts.me`
- Do **not** clone into the server’s document root (e.g. `/var/www/html`) if that is used for another site.
- Clone and run all commands from this subdomain directory.

**Example — first-time setup:**

```bash
# Create directory for the subdomain and clone there
sudo mkdir -p /var/www/intone.jamescutts.me
sudo chown $USER:$USER /var/www/intone.jamescutts.me
cd /var/www/intone.jamescutts.me
git clone https://github.com/deepdesign/intone.git .
# Then: .env, npm ci, db:generate, db:deploy, db:seed, build, start (see below)
```

**Example — if you already cloned to home or root:**

```bash
# Move the repo into the subdomain directory
sudo mkdir -p /var/www/intone.jamescutts.me
sudo chown $USER:$USER /var/www/intone.jamescutts.me
mv ~/intone/* /var/www/intone.jamescutts.me/
mv ~/intone/.* /var/www/intone.jamescutts.me/ 2>/dev/null || true
rmdir ~/intone 2>/dev/null || true
cd /var/www/intone.jamescutts.me
# Then run deploy steps or ./scripts/deploy-vps.sh
```

**nginx:** Use a separate `server` block for `intone.jamescutts.me` (see section 4). The subdomain does not use a file `root`; nginx proxies to `http://127.0.0.1:3000` where the Node app runs.

## Prerequisites on the VPS

- **Node.js 18+** (LTS)
- **PostgreSQL** — on the same VPS or external (e.g. [Neon](https://neon.tech))
- **nginx** (or Caddy) — reverse proxy, SSL
- **PM2** (optional) — keep the app running and restart on crash

## 1. Environment variables

Create a `.env` file on the server (same as local, but with production values):

```env
DATABASE_URL="postgresql://user:password@host:5432/intone?sslmode=require"
NEXTAUTH_SECRET="strong-random-secret"   # e.g. openssl rand -base64 32
NEXTAUTH_URL="https://intone.jamescutts.me"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
OPENAI_API_KEY="sk-..."
```

**Important:** In Google Cloud Console, add your production URL to the OAuth consent screen and redirect URIs:  
`https://intone.jamescutts.me/api/auth/callback/google`

## 2. Deploy steps (on the VPS)

```bash
# Clone (or pull latest)
git clone https://github.com/deepdesign/intone.git
cd intone

# Install dependencies
npm ci

# Generate Prisma client
npm run db:generate

# Run production migrations (do not use db:migrate on production)
npm run db:deploy

# Seed rule definitions (once)
npm run db:seed

# Build
npm run build

# Run (or use PM2)
npm run start
```

The app listens on **port 3000** by default. Use nginx to proxy `https://intone.jamescutts.me` → `http://127.0.0.1:3000`.

## 3. Run with PM2 (recommended)

```bash
npm install -g pm2
pm2 start npm --name "intone" -- start
pm2 save
pm2 startup   # Enable restart on reboot
```

## 4. nginx example

```nginx
server {
    listen 443 ssl;
    server_name intone.jamescutts.me;
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 5. Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL reachable; `DATABASE_URL` set
- [ ] `.env` on server with production values
- [ ] `NEXTAUTH_URL` = `https://intone.jamescutts.me`
- [ ] Google OAuth redirect URI = `https://intone.jamescutts.me/api/auth/callback/google`
- [ ] `npm run db:deploy` run (migrations applied)
- [ ] `npm run db:seed` run once
- [ ] `npm run build` and `npm run start` (or PM2)
- [ ] nginx proxying HTTPS to port 3000
- [ ] Firewall allows 80, 443; app listens on 3000 locally

## 6. Updating the app

From the project root on the VPS, run the deploy script:

```bash
cd intone
./scripts/deploy-vps.sh
```

Or run the steps manually:

```bash
cd intone
git pull
npm ci
npm run db:generate
npm run db:deploy
npm run build
pm2 restart intone
```

---

You’re ready to deploy to Hostinger (or any VPS) by following the steps above.
