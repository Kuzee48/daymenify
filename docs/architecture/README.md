# Daymenify — Architecture & Planning Documentation

> Production-grade Indonesian digital marketplace & top-up platform

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Executive Summary & PRD](./01-executive-summary-prd.md) | Vision, business model, requirements, personas, KPIs, development phases |
| 02 | [High-Level Architecture](./02-high-level-architecture.md) | System diagram, module boundaries, tech stack justification, data flows |
| 03 | [Backend Architecture](./03-backend-architecture.md) | Folder structure, service layer, API endpoints (150+), middleware, validation |
| 04 | [Frontend Architecture](./04-frontend-architecture.md) | Next.js App Router, design system, state management, SEO, performance |
| 05 | [Database Design](./05-database-design.md) | Prisma schema (30+ models), relationships, indexes, migration strategy |
| 06 | [Queue & Realtime](./06-queue-realtime-architecture.md) | BullMQ queues, Socket.io, event bus, webhooks, caching |
| 07 | [Provider & Payment](./07-provider-payment-architecture.md) | Provider adapters, payment adapters, smart routing, webhook processing |
| 08 | [Security & RBAC](./08-security-rbac-fraud.md) | JWT auth, RBAC permissions, rate limiting, fraud detection, audit logs |
| 09 | [Subsystems Design](./09-subsystems-design.md) | Wallet, referral, spin wheel, flash sale, notifications, CMS, tickets |
| 10 | [Deployment & Scalability](./10-deployment-scalability.md) | Docker, CI/CD, monitoring, backups, scaling strategy, dev phases |

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TailwindCSS, Framer Motion, Zustand |
| Backend | Node.js, Express.js, Socket.io |
| Database | PostgreSQL 16, Prisma ORM |
| Cache/Queue | Redis 7, BullMQ |
| Infrastructure | Docker, Nginx, Cloudflare CDN |

## Architecture Style

**Modular Monolith** — Single deployable with clear module boundaries, designed for future microservice extraction if needed.

## Development Timeline

- **Phase 1** (Weeks 1-4): Foundation — Auth, catalog, admin panel
- **Phase 2** (Weeks 5-8): Transactions — Payments, providers, auto-complete
- **Phase 3** (Weeks 9-12): Growth — Wallet, referrals, vouchers, multi-provider
- **Phase 4** (Weeks 13-16): Polish — Gamification, CMS, SEO, performance
- **Phase 5** (Weeks 17-18): Launch — Staging, security audit, production deploy

---

*Generated: 2026-05-08 | Status: Architecture Planning Complete*
