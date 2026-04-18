# Real Estate CRM

Production-ready CRM for lead intake, client/property management, deal pipeline, communications, reporting, and integrations.

## Status

- Phase 1: Foundation and scaffolding - complete
- Phase 2: Auth and access control - complete
- Phase 3: Core operations and reporting - complete
- Phase 4: Extended modules (leads, properties, users, integrations, notifications, webhooks) - complete
- Final polish: complete

## Tech Stack

- Backend: Node.js, Express, TypeScript, Prisma, MySQL, Vitest
- Frontend: React 18, Vite, TypeScript, Tailwind, React Query, Zustand

## Workspace Layout

- backend: API service, Prisma schema, tests
- frontend: SPA client and UI features

## Local Development

### 1) Configure environment files

Backend:

```bash
cd backend
copy .env.example .env
```

Frontend:

```bash
cd frontend
copy .env.example .env
```

### 2) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3) Prepare database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

Optional seed:

```bash
npm run seed
```

### 4) Run both services

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

### 5) Initial Sign-In (First Time)

- User ID (Email): admin@realestatecrm.local
- Password: Admin@12345

Important:
- This project does not create a default user automatically.
- On a fresh database, open the Register page first and create the account above.
- The first registered user is automatically assigned the ADMIN role.
- After first login, change the password immediately.

Default URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/v1
- Health check: http://localhost:5000/api/v1/health

## Quality Gates

Backend:

```bash
cd backend
npm run lint
npm run build
npm run test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
npx vitest run --reporter=basic
```

## Deployment

See detailed deployment runbook in DEPLOYMENT.md.

It includes:

- required production environment variables
- single-VM deployment (Node + PM2 + Nginx + SSL)
- managed-host split deployment (API + static frontend)
- post-deploy verification and rollback checklist
