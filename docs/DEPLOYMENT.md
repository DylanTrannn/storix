# Storix Deployment Guide

Deploy Storix on a single VPS using [Coolify](https://coolify.io). Web and API are independent services.

## Prerequisites

- VPS with Docker
- Coolify installed
- Domain names (optional): `shop.example.com`, `api.example.com`

## Services

| Service    | Port | Image build context      |
| ---------- | ---- | ------------------------ |
| Web        | 3000 | `apps/web/Dockerfile`    |
| API        | 3001 | `apps/api/Dockerfile`    |
| PostgreSQL | 5432 | Coolify managed          |
| Redis      | 6379 | Coolify managed          |

## 1. PostgreSQL & Redis

Create PostgreSQL 16 and Redis 7 services in Coolify. Note connection URLs for the API.

## 2. API Service

**Build:** Dockerfile at repo root context, file `apps/api/Dockerfile`

**Environment variables:**

```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@postgres:5432/storix
REDIS_URL=redis://redis:6379
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=15m
CORS_ORIGIN=https://shop.example.com
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET=storix-media
R2_PUBLIC_URL=https://media.example.com
R2_UPLOAD_MAX_BYTES=5242880
R2_ALLOWED_MIME=image/jpeg,image/png,image/webp,image/gif
```

**Startup command (run migrations before start):**

```bash
node dist/infrastructure/database/migrate.js && node dist/main.js
```

Or run migrations once via Coolify "Execute Command" after first deploy.

**Health check:** `GET /api/health`

## 3. Web Service

**Build:** Dockerfile at repo root context, file `apps/web/Dockerfile`

**Build args:**

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_APP_URL=https://shop.example.com
```

**Runtime env:** Same `NEXT_PUBLIC_*` values if needed at runtime.

**Health check:** `GET /` (200 OK)

## 4. Seed Data (first deploy only)

```bash
# In API container or local with DATABASE_URL set
pnpm db:seed
```

Default admin: `admin@storix.local` / `admin123456`

### Cloudflare R2 setup

1. Create an R2 bucket in Cloudflare dashboard
2. Create API token with Object Read & Write permissions
3. Enable public access via custom domain or `r2.dev` subdomain
4. Set `R2_*` env vars on the API service (see `apps/api/.env.example`)
5. Set `NEXT_PUBLIC_R2_PUBLIC_URL` on the web service (same as `R2_PUBLIC_URL`) for Next.js image optimization

Product thumbnails use the first gallery image (`sortOrder = 0`) — no separate thumbnail field.

## 5. Local Development

```bash
docker compose up -d
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs

## Architecture Notes

- **Backend:** NestJS clean architecture — domain/application/infrastructure/presentation per module
- **Frontend:** Next.js 15 Server Components, ISR (`revalidate = 60`), `React.cache()` API helpers, dynamic imports for admin UI
- **Auth:** JWT access token (cookie) + httpOnly refresh token cookie

## Independent Deploys

- Deploy **web** alone when frontend changes — only needs `NEXT_PUBLIC_API_URL`
- Deploy **api** alone when backend changes — run migrations if schema changed
- Regenerate SDK after API contract changes: `pnpm generate:sdk`
