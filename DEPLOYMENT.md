# Deployment Runbook

This guide covers production deployment for the Real Estate CRM.

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- MySQL 8+
- Linux VM or managed hosting platform
- Domain names (recommended):
  - app.example.com for frontend
  - api.example.com for backend

## Required Environment Variables

### Backend (.env)

Copy from backend/.env.example and set production values.

Critical values to set securely:

- NODE_ENV=production
- PORT (for backend process, usually 5000)
- APP_BASE_URL (for example https://api.example.com)
- FRONTEND_URL (for example https://app.example.com)
- CORS_ORIGIN (comma-separated origins, for example https://app.example.com)
- DATABASE_URL (production MySQL connection)
- JWT_ACCESS_SECRET (min 32 chars, strong random)
- JWT_REFRESH_SECRET (min 32 chars, strong random)
- CLOUDINARY_* variables
- SMTP_* variables

### Frontend (.env)

Copy from frontend/.env.example and set:

- VITE_API_BASE_URL=https://api.example.com/api/v1
- VITE_SOCKET_URL=https://api.example.com
- VITE_APP_NAME (optional branding)

## Option A: Single Linux VM (Node + PM2 + Nginx)

### 1) Provision system packages

```bash
sudo apt update
sudo apt install -y nginx mysql-client
sudo npm install -g pm2
```

Install Node 20+ with your preferred method (nvm or package source).

### 2) Upload project and install dependencies

```bash
cd /var/www
sudo mkdir -p real-estate-crm
sudo chown -R $USER:$USER real-estate-crm
cd real-estate-crm

# copy files into this directory

cd backend && npm ci
cd ../frontend && npm ci
```

### 3) Configure environment files

```bash
cd /var/www/real-estate-crm/backend
cp .env.example .env
# edit .env with production values

cd ../frontend
cp .env.example .env
# edit .env with production values
```

### 4) Run database migrations

```bash
cd /var/www/real-estate-crm/backend
npm run prisma:generate
npm run prisma:deploy
```

Optional initial data:

```bash
npm run seed
```

### 5) Build applications

```bash
cd /var/www/real-estate-crm/backend
npm run build

cd ../frontend
npm run build
```

### 6) Start backend with PM2

```bash
cd /var/www/real-estate-crm/backend
pm2 start dist/server.js --name real-estate-crm-api
pm2 save
pm2 startup
```

### 7) Configure Nginx

Example /etc/nginx/sites-available/real-estate-crm:

```nginx
server {
    listen 80;
    server_name app.example.com;

    root /var/www/real-estate-crm/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/real-estate-crm /etc/nginx/sites-enabled/real-estate-crm
sudo nginx -t
sudo systemctl reload nginx
```

### 8) Enable SSL (recommended)

Use Certbot to issue certificates for app and api domains.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com -d api.example.com
```

## Option B: Managed Hosting Split

### Backend service (Render/Railway/Fly or similar)

- Root: backend
- Build command: npm ci && npm run build
- Start command: npm run start
- Set all backend env vars from backend/.env.example
- Run one-time command after first deploy:

```bash
npm run prisma:deploy
```

### Frontend service (Vercel/Netlify/Cloudflare Pages or similar)

- Root: frontend
- Build command: npm ci && npm run build
- Output directory: dist
- Set VITE_API_BASE_URL and VITE_SOCKET_URL to production backend URL

## Post-Deploy Verification

### API checks

```bash
curl https://api.example.com/
curl https://api.example.com/api/v1/health
```

Expected: HTTP 200 responses.

### Frontend checks

- open https://app.example.com
- verify login/register flow
- verify dashboard and phase-4 pages load

### Regression checks

- auth token refresh works
- leads/properties/users lists load
- integrations page can create and rotate credentials
- webhooks test trigger returns success/failure delivery record

## Release Checklist

1. Run backend lint/build/test.
2. Run frontend lint/build/test.
3. Apply database migrations with prisma migrate deploy.
4. Deploy backend.
5. Deploy frontend with correct VITE_API_BASE_URL.
6. Run health checks and smoke checks.
7. Monitor logs and error rates for at least 15 minutes.

## Rollback

If deployment fails:

1. Re-deploy previous backend artifact/version.
2. Re-deploy previous frontend artifact/version.
3. If migration introduced breaking schema changes, restore from DB backup and redeploy previous backend.
4. Re-run health checks.

## Operational Notes

- Keep JWT secrets and SMTP credentials in a secret manager, not in repository files.
- Keep CORS_ORIGIN strict (only trusted frontend origins).
- Rotate API credentials and webhook secrets on a regular schedule.
- Back up MySQL before each production migration.
