# Storix

MVP ecommerce platform for small-to-medium brands.

## Stack

- **Monorepo:** pnpm + Turborepo
- **Web:** Next.js 15, TanStack Query, Shadcn UI
- **API:** NestJS (clean architecture), Drizzle ORM, PostgreSQL, Redis
- **Shared:** Zod schemas in `@storix/shared`, typed client in `@storix/sdk`

## Quick Start

```bash
docker compose up -d
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| Service | URL |
| ------- | --- |
| Storefront | http://localhost:3000 |
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |

**Seed admin:** `admin@storix.local` / `admin123456`

## Scripts

```bash
pnpm dev          # Start all apps
pnpm build        # Production build
pnpm db:migrate   # Run database migrations
pnpm db:seed      # Seed sample data
pnpm generate:sdk # Regenerate API client from OpenAPI
```

Configure Cloudflare R2 in `apps/api/.env` for product image uploads (see `apps/api/.env.example`).

## Project Structure

```txt
apps/web/     Next.js storefront + admin
apps/api/     NestJS REST API
packages/shared/  Zod schemas
packages/sdk/     API client
packages/ui/      Shadcn components
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Coolify/VPS deployment.
