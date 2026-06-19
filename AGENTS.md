# Project Overview

Build an MVP ecommerce platform (Storix) for small-to-medium brands.

The goal is NOT to build a Shopify competitor.

The goal is to allow a merchant to:

- Showcase products online
- Manage products and collections
- Receive orders
- Manage customers
- Build brand presence through a website

The MVP should focus on simplicity, performance, maintainability, SEO, and low infrastructure cost.

---

# Technical Architecture

## Monorepo

Use pnpm workspace + Turborepo.

Structure:

```txt
apps/
  web/
  api/

packages/
  shared/
  sdk/
  ui/
```

---

## Frontend

Framework:

- Next.js 15
- TypeScript
- TailwindCSS
- App Router

Libraries:

- TanStack Query
- React Hook Form
- Zod
- Zustand

Requirements:

- SEO optimized
- SSR for SEO pages
- Mobile responsive
- Lighthouse score target > 90

Use:

- Server Components whenever possible
- Client Components only when needed
- Dynamic imports for heavy components

Do NOT statically generate all products.

Use:

- SSR
- ISR

---

## Backend

Framework:

- NestJS
- TypeScript

Architecture:

- Modular Clean Architecture

Structure:

```txt
src/
  modules/
    product/
    collection/
    cart/
    order/
    user/

  infrastructure/
    database/
    cache/

  shared/
```

Each module contains:

```txt
domain/
application/
infrastructure/
presentation/
```

Avoid over-engineering.

Focus on business use cases.

---

## Database

PostgreSQL

ORM:

- Drizzle ORM

Requirements:

- Migration support
- Seed support

---

## Validation

Use Zod as the source of truth.

Shared schemas live in:

```txt
packages/shared
```

Example:

```ts
ProductSchema;
CollectionSchema;
OrderSchema;
UserSchema;
```

Generate TypeScript types from schemas.

Do not duplicate DTO definitions.

---

## API

REST API

Generate OpenAPI documentation.

Generate frontend SDK from OpenAPI.

Store generated SDK in:

```txt
packages/sdk
```

Frontend should use SDK instead of manually writing API requests.

---

## Authentication

MVP:

- Email + Password
- JWT Authentication
- Refresh Token

Roles:

- Admin
- Customer

---

# MVP Features

## Storefront

### Home Page

Sections:

- Hero banner
- Featured collections
- Featured products
- Brand introduction

---

### Collection Page

Features:

- Product grid
- Pagination
- Sorting

Optional:

- Basic filters

---

### Product Page

Features:

- Product gallery
- Product information
- Price
- Variants
- Add to cart
- Related products

SEO requirements:

- Metadata
- Open Graph tags
- Structured data

---

### Cart

Features:

- Add item
- Update quantity
- Remove item
- Calculate subtotal

---

### Checkout

MVP Checkout:

- Customer information
- Shipping address
- Order notes

Payment:

- Cash on Delivery
- Manual Bank Transfer

No payment gateway integration for MVP.

---

### Customer Account

Features:

- Profile
- Order history

---

### Wishlist

Features:

- Add to wishlist
- Remove from wishlist

---

### Store Locations

Features:

- List all stores
- Store information
- Map link

---

# Admin Panel

## Product Management

Features:

- Create product
- Update product
- Delete product
- Upload images
- Manage variants

---

## Collection Management

Features:

- Create collection
- Update collection
- Delete collection

---

## Order Management

Features:

- View orders
- Update order status

Statuses:

- Pending
- Confirmed
- Processing
- Shipped
- Completed
- Cancelled

---

## User Management

Features:

- View customers
- View order history

---

# Non-MVP Features

Do NOT implement:

- Loyalty Program
- Reward Points
- Referral Program
- Membership Tiers
- Marketing Automation
- Push Notifications
- Multi-store Inventory
- POS
- Advanced Promotions
- Advanced Coupons
- CRM
- Mobile App
- Payment Gateway Integrations
- Shipping Integrations

These belong to future phases.

---

# Infrastructure

Deployment target:

- Single VPS
- Coolify

Services:

- Web
- API
- PostgreSQL
- Redis

Frontend and Backend must be deployable independently.

---

# Code Standards

- TypeScript strict mode
- ESLint
- Prettier
- Feature-based folder structure
- No duplicated types
- Use shared schemas
- Prefer composition over inheritance
- Write reusable components
- Avoid unnecessary abstractions

---

# Expected Deliverables

Phase 1:

- Project scaffolding
- Monorepo setup
- Authentication
- Database schema

Phase 2:

- Product module
- Collection module

Phase 3:

- Cart
- Checkout

Phase 4:

- Customer account
- Wishlist

Phase 5:

- Admin panel

Generate code incrementally and keep architecture clean and maintainable.

Remember to generate the complete domain model and database schema (Product, ProductVariant, Collection, Cart, Order, OrderItem, User, Address, Wishlist, StoreLocation)
