# Daymenify — High-Level Architecture & System Design

## Document Version
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-05-08 | Architecture Team | Draft |

---

## 1. System Architecture Overview

### 1.1 Architecture Style
Daymenify adopts a **Modular Monolith** architecture for initial deployment, designed with clear boundaries to enable future microservice extraction if needed.

**Why Modular Monolith (not Microservices)?**
- Faster initial development for startup velocity
- Simpler deployment and debugging
- Lower infrastructure cost at launch
- Clear module boundaries allow future extraction
- Single database reduces consistency complexity
- Team size (small) doesn't justify microservice overhead

**Future Migration Path:**
```
Phase 1-2: Modular Monolith (single deployable)
Phase 3-4: Extract Queue Workers as separate services
Phase 5+:  Extract Payment/Provider services if traffic demands
```

### 1.2 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET / USERS                                │
└─────────────────┬───────────────────────────────────────┬───────────────────┘
                  │                                       │
                  ▼                                       ▼
┌─────────────────────────────┐         ┌─────────────────────────────┐
│      CDN (Cloudflare)       │         │   DNS (Cloudflare DNS)      │
│  - Static assets            │         │   - SSL termination         │
│  - Image optimization       │         │   - DDoS protection         │
│  - Edge caching             │         │   - Rate limiting (L7)      │
└─────────────┬───────────────┘         └─────────────┬───────────────┘
              │                                       │
              ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOAD BALANCER / REVERSE PROXY                        │
│                              (Nginx / Traefik)                               │
└──────┬──────────────────────────┬───────────────────────────┬───────────────┘
       │                          │                           │
       ▼                          ▼                           ▼
┌──────────────┐      ┌─────────────────────┐      ┌──────────────────┐
│  NEXT.JS APP │      │   EXPRESS API SERVER │      │  SOCKET.IO SERVER│
│  (Frontend)  │      │     (Backend)        │      │   (Realtime)     │
│              │      │                      │      │                  │
│  - SSR/SSG   │      │  - REST API          │      │  - Live feed     │
│  - App Router│      │  - Webhook handlers  │      │  - Notifications │
│  - React     │      │  - Auth middleware   │      │  - Admin alerts  │
│  - Zustand   │      │  - Service layer     │      │  - Status updates│
└──────┬───────┘      └──────────┬───────────┘      └────────┬─────────┘
       │                         │                           │
       │                         ▼                           │
       │              ┌─────────────────────┐                │
       │              │    SERVICE LAYER     │                │
       │              │                     │                │
       │              │  - TransactionSvc   │                │
       │              │  - PaymentSvc       │                │
       │              │  - ProviderSvc      │                │
       │              │  - UserSvc          │                │
       │              │  - WalletSvc        │                │
       │              │  - NotificationSvc  │                │
       │              │  - CacheSvc         │                │
       │              └──────────┬──────────┘                │
       │                         │                           │
       ▼                         ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ PostgreSQL  │  │    Redis     │  │   BullMQ    │  │  S3/R2      │       │
│  │             │  │             │  │   (Queues)  │  │  (Storage)  │       │
│  │ - Primary DB│  │ - Cache     │  │             │  │             │       │
│  │ - Prisma ORM│  │ - Sessions  │  │ - Orders    │  │ - Images    │       │
│  │ - Read rep. │  │ - Rate limit│  │ - Sync jobs │  │ - Uploads   │       │
│  │   (future)  │  │ - Pub/Sub   │  │ - Notif.    │  │ - Invoices  │       │
│  └─────────────┘  └─────────────┘  │ - Cron jobs │  └─────────────┘       │
│                                     └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL INTEGRATIONS                                │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │ PAYMENT        │  │ PROVIDERS      │  │ NOTIFICATIONS  │                │
│  │ GATEWAYS       │  │                │  │                │                │
│  │                │  │ - Digiflazz    │  │ - SMTP (Email) │                │
│  │ - Midtrans     │  │ - VIP-Reseller │  │ - Telegram Bot │                │
│  │ - Xendit       │  │ - Tokovoucher  │  │ - Discord Hook │                │
│  │ - Tripay       │  │ - Custom APIs  │  │ - FCM (Push)   │                │
│  │ - Duitku       │  │                │  │ - WhatsApp API │                │
│  │ - Bayar.gg     │  └────────────────┘  └────────────────┘                │
│  │ - Pakasir      │                                                         │
│  └────────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Module Architecture

### 2.1 Module Boundary Map

```
┌─────────────────────────────────────────────────────────┐
│                    DAYMENIFY PLATFORM                     │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   AUTH   │ │  CATALOG │ │  ORDER   │ │  PAYMENT │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ PROVIDER │ │  WALLET  │ │ REFERRAL │ │  NOTIF   │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   CMS    │ │  SUPPORT │ │  ADMIN   │ │  GAMIFY  │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  AUDIT   │ │ MONITOR  │ │   SEO    │ │  EVENT   │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Module Responsibilities

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| Auth | User registration, login, JWT, sessions, RBAC | Redis, PostgreSQL |
| Catalog | Products, categories, pricing, search, sync | Provider, Redis |
| Order | Transaction lifecycle, status management | Payment, Provider, Queue |
| Payment | Gateway abstraction, webhook processing | Order, Wallet, Queue |
| Provider | External API communication, product fulfillment | Queue, Order |
| Wallet | Balance management, deposits, withdrawals | Payment, Auth |
| Referral | Referral tracking, commission calculation | Wallet, Auth |
| Notification | Multi-channel delivery, templates | Queue, all modules |
| CMS | Articles, banners, announcements | Storage, SEO |
| Support | Tickets, replies, file uploads | Notification, Storage |
| Admin | Dashboard, management UI, analytics | All modules |
| Gamification | Spin wheel, vouchers, cashback, flash sales | Wallet, Catalog |
| Audit | Activity logging, compliance tracking | All modules |
| Monitor | Health checks, provider status, alerts | Provider, Payment |
| SEO | Metadata, sitemap, structured data | CMS, Catalog |
| Event | Seasonal events, themes, promotions | CMS, Gamification |

---

## 3. Technology Stack Justification

### 3.1 Frontend: Next.js 14+ (App Router)

**Why Next.js?**
- Server-Side Rendering (SSR) for SEO-critical pages (product pages, blog)
- Static Site Generation (SSG) for marketing pages
- App Router for modern React patterns (Server Components, Streaming)
- Built-in image optimization
- API routes for BFF (Backend for Frontend) pattern
- Excellent performance out of the box
- Large ecosystem and community

**Why NOT plain React SPA?**
- SEO is critical for organic traffic acquisition
- First Contentful Paint matters for Indonesian mobile users (slower networks)
- Server Components reduce client-side JavaScript bundle

### 3.2 State Management: Zustand

**Why Zustand over Redux Toolkit?**
- Simpler API, less boilerplate
- Better TypeScript inference
- Smaller bundle size (~1KB vs ~11KB)
- No provider wrapper needed
- Perfect for medium-complexity state
- Easy integration with React Server Components

**State Domains:**
- `useAuthStore` — User session, tokens
- `useCartStore` — Current checkout flow
- `useNotificationStore` — Real-time notifications
- `useUIStore` — Modals, drawers, theme

### 3.3 Backend: Express.js

**Why Express over Fastify/NestJS?**
- Largest middleware ecosystem
- Team familiarity (Indonesian dev market)
- Simple, flexible, well-documented
- Easy to structure with custom patterns
- Socket.io native integration
- Mature and battle-tested

**Why NOT NestJS?**
- Overkill for initial phase
- Higher learning curve
- More opinionated (may conflict with custom architecture)
- Express + custom patterns gives same benefits with less complexity

### 3.4 Database: PostgreSQL + Prisma

**Why PostgreSQL?**
- ACID compliant (critical for financial transactions)
- Excellent JSON support (for flexible metadata)
- Full-text search (product search without Elasticsearch initially)
- Proven at scale (handles millions of rows efficiently)
- Rich indexing (B-tree, GIN, GiST)
- Row-level security (future multi-tenancy)

**Why Prisma?**
- Type-safe database client
- Auto-generated TypeScript types
- Migration management
- Visual database browser (Prisma Studio)
- Query optimization with select/include
- Relation handling
- Indonesian developer ecosystem adoption

### 3.5 Queue: BullMQ + Redis

**Why BullMQ?**
- Production-proven job queue
- Delayed jobs (payment expiry)
- Retry with exponential backoff
- Job prioritization
- Concurrency control
- Dead letter queue
- Dashboard (Bull Board)
- Cron job support (repeatable jobs)

**Queue Use Cases:**
- Order processing (after payment confirmed)
- Provider API calls (rate limited)
- Product sync (thousands of products)
- Notification dispatch
- Report generation
- Cleanup jobs

### 3.6 Realtime: Socket.io

**Why Socket.io?**
- WebSocket with fallback (important for Indonesian mobile networks)
- Room-based messaging (per-user notifications)
- Namespace separation (admin vs user)
- Redis adapter for horizontal scaling
- Automatic reconnection
- Binary support (future features)

### 3.7 Cache: Redis

**Why Redis?**
- Sub-millisecond response times
- Session storage
- Rate limiting
- Cache layer (product prices, settings)
- BullMQ backend
- Pub/Sub for Socket.io scaling
- Atomic operations (wallet balance locking)

---

## 4. Data Flow Architecture

### 4.1 Transaction Data Flow (Happy Path)

```
┌──────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ User │───▶│  Create  │───▶│  Select  │───▶│  Create  │───▶│  Return  │
│      │    │  Order   │    │ Payment  │    │ Payment  │    │  Pay URL │
└──────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                                   │
                                                                   ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────┐
│  Notify  │◀───│ Complete │◀───│ Provider │◀───│  Queue   │◀───│  Pay │
│   User   │    │  Order   │    │ API Call │    │   Job    │    │      │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────┘
                                                                   │
                                                              (Webhook)
```

### 4.2 Payment Webhook Flow

```
Payment Gateway ──webhook──▶ /api/webhook/{gateway}
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Verify Signature │
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Idempotency Check│ (prevent duplicates)
                            └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Update Payment  │
                            │   Status        │
                            └────────┬────────┘
                                     │
                              ┌──────┴──────┐
                              │             │
                         (success)      (failed)
                              │             │
                              ▼             ▼
                     ┌──────────────┐ ┌──────────────┐
                     │ Queue: Order │ │ Notify User  │
                     │  Processing  │ │ (failed pay) │
                     └──────────────┘ └──────────────┘
```

### 4.3 Provider Order Flow

```
Queue picks up job
        │
        ▼
┌─────────────────┐
│  Select Provider│ (smart routing: price, availability, priority)
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Call Provider   │────▶│  Provider API   │
│      API         │     │  (Digiflazz/etc)│
└────────┬────────┘     └─────────────────┘
         │
    ┌────┴────┐
    │         │
(success)  (failed)
    │         │
    ▼         ▼
┌────────┐ ┌────────────────┐
│Complete│ │ Try Fallback   │
│ Order  │ │ Provider       │
└────────┘ └───────┬────────┘
                   │
              ┌────┴────┐
              │         │
          (success)  (all failed)
              │         │
              ▼         ▼
         ┌────────┐ ┌────────────┐
         │Complete│ │Mark Failed │
         │ Order  │ │Notify Admin│
         └────────┘ │Queue Retry │
                    └────────────┘
```

### 4.4 Product Sync Flow

```
Cron (every 30min) OR Admin trigger
              │
              ▼
┌─────────────────────────┐
│ Queue: product-sync job │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Fetch products from     │
│ provider API (paginated)│
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Compare with existing   │
│ products (deduplication)│
└────────────┬────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐
│ New  │ │Update│ │Remove│
│Insert│ │Price │ │Stale │
└──────┘ └──────┘ └──────┘
             │
             ▼
┌─────────────────────────┐
│ Invalidate Redis cache  │
│ Recalculate markups     │
│ Log sync results        │
└─────────────────────────┘
```

---

## 5. Infrastructure Architecture

### 5.1 Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE                            │
│  DNS + CDN + DDoS Protection + WAF + SSL                │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  VPS / CLOUD SERVER                      │
│              (DigitalOcean / Hetzner / AWS)              │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │                 DOCKER COMPOSE                    │    │
│  │                                                   │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐   │    │
│  │  │  Nginx    │  │  Next.js  │  │  Express  │   │    │
│  │  │  Proxy    │  │  :3000    │  │  :4000    │   │    │
│  │  └───────────┘  └───────────┘  └───────────┘   │    │
│  │                                                   │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐   │    │
│  │  │ Socket.io │  │  Worker   │  │  Cron     │   │    │
│  │  │  :4001    │  │ (BullMQ)  │  │  Runner   │   │    │
│  │  └───────────┘  └───────────┘  └───────────┘   │    │
│  │                                                   │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐   │    │
│  │  │PostgreSQL │  │   Redis   │  │ Bull Board│   │    │
│  │  │  :5432    │  │  :6379    │  │  :4002    │   │    │
│  │  └───────────┘  └───────────┘  └───────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              VOLUMES / STORAGE                    │    │
│  │  /data/postgres  /data/redis  /data/uploads      │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Scaling Strategy

**Vertical Scaling (Phase 1-3):**
- Start with 4 vCPU / 8GB RAM VPS
- Upgrade to 8 vCPU / 16GB RAM as traffic grows
- Dedicated database instance at 50K+ daily transactions

**Horizontal Scaling (Phase 4+):**
- Separate Next.js and Express into different containers
- Multiple worker instances (BullMQ supports multi-worker)
- Redis cluster for session/cache scaling
- PostgreSQL read replicas for analytics queries
- CDN for all static assets

### 5.3 Container Architecture

```yaml
# docker-compose.yml services overview
services:
  nginx:        # Reverse proxy, SSL termination, rate limiting
  nextjs:       # Frontend application (SSR/SSG)
  api:          # Express.js backend API
  socketio:     # Realtime WebSocket server
  worker:       # BullMQ job processor
  cron:         # Scheduled job runner
  postgres:     # Primary database
  redis:        # Cache, sessions, queues
  bullboard:    # Queue monitoring dashboard (admin only)
```

---

## 6. Communication Patterns

### 6.1 Synchronous (Request-Response)
- User → API: REST HTTP (JSON)
- Frontend → Backend: Axios HTTP client
- Admin → API: REST HTTP with JWT
- API → Database: Prisma ORM queries

### 6.2 Asynchronous (Event-Driven)
- Payment Webhook → Queue → Order Processing
- Order Complete → Notification Dispatch
- Product Sync → Bulk Database Updates
- Admin Action → Audit Log Write

### 6.3 Realtime (WebSocket)
- Server → User: Transaction status updates
- Server → Admin: New order/alert notifications
- Server → All: Live order feed
- Server → User: Notification delivery

### 6.4 Scheduled (Cron)
- Every 30 min: Product sync from providers
- Every 5 min: Pending payment expiry check
- Every 1 min: Provider health check
- Every 1 hour: Analytics aggregation
- Every day: Stale data cleanup
- Every day: Sitemap regeneration

---

## 7. Error Handling Strategy

### 7.1 Error Classification

| Level | Type | Action |
|-------|------|--------|
| L1 | Validation errors | Return 400 with details |
| L2 | Auth errors | Return 401/403, log attempt |
| L3 | Business logic errors | Return 422 with explanation |
| L4 | External service errors | Retry, fallback, alert admin |
| L5 | System errors | Log, alert, circuit break |

### 7.2 Circuit Breaker Pattern (Provider/Gateway)

```
States: CLOSED → OPEN → HALF_OPEN → CLOSED

CLOSED: Normal operation, track failures
  → If failures > threshold in window → OPEN

OPEN: Reject all requests, use fallback
  → After cooldown period → HALF_OPEN

HALF_OPEN: Allow limited requests to test
  → If success → CLOSED
  → If failure → OPEN
```

### 7.3 Retry Strategy

| Operation | Max Retries | Backoff | Timeout |
|-----------|-------------|---------|---------|
| Provider order | 3 | Exponential (1s, 4s, 16s) | 30s |
| Payment verification | 5 | Linear (5s) | 60s |
| Notification send | 3 | Exponential (2s, 8s, 32s) | 15s |
| Product sync | 2 | Fixed (30s) | 120s |
| Webhook delivery | 5 | Exponential (1m, 5m, 30m, 2h, 12h) | 30s |

---

## 8. Observability Architecture

### 8.1 Logging Strategy

```
Application Logs → Structured JSON → File/stdout → Log aggregation
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Dashboard  │
                                                  │  (Grafana)  │
                                                  └─────────────┘
```

**Log Levels:**
- `ERROR`: System failures, unhandled exceptions
- `WARN`: Provider timeouts, retry attempts, rate limits
- `INFO`: Transaction completed, payment received, sync finished
- `DEBUG`: API calls, query details (dev only)

### 8.2 Metrics to Track

| Category | Metrics |
|----------|---------|
| Business | Transactions/hour, revenue, success rate, avg order value |
| Technical | Response time (p50/p95/p99), error rate, queue depth |
| Provider | Success rate per provider, avg fulfillment time |
| Payment | Conversion rate, abandonment rate, gateway uptime |
| Infrastructure | CPU, memory, disk, network, connection pool |

### 8.3 Alerting Rules

| Alert | Condition | Channel | Severity |
|-------|-----------|---------|----------|
| High error rate | > 5% in 5min | Telegram + Discord | Critical |
| Provider down | 3 consecutive failures | Telegram | High |
| Queue backing up | > 100 pending jobs | Discord | Medium |
| Payment gateway error | > 3 failures in 1min | Telegram | Critical |
| Disk space low | > 85% used | Email | Medium |
| Database slow | avg query > 200ms | Discord | Medium |

---

## 9. Security Architecture Overview

### 9.1 Defense in Depth

```
Layer 1: CDN/WAF (Cloudflare) — DDoS, bot protection
Layer 2: Rate Limiting (Nginx + Redis) — Request throttling
Layer 3: Authentication (JWT) — Identity verification
Layer 4: Authorization (RBAC) — Permission enforcement
Layer 5: Input Validation (Zod/Joi) — Data sanitization
Layer 6: Business Logic — Fraud detection, limits
Layer 7: Database — Row-level security, encryption at rest
Layer 8: Audit — Complete activity logging
```

### 9.2 Authentication Flow

```
Register → Verify Email → Login → JWT (15min) + Refresh Token (7d)
                                         │
                                         ▼
                              Access protected resources
                                         │
                                    (JWT expired?)
                                         │
                                    ┌────┴────┐
                                    │         │
                                  (no)      (yes)
                                    │         │
                                    ▼         ▼
                               Continue   Use Refresh Token
                                         → New JWT + New Refresh
                                         → Old Refresh invalidated
```

---

## 10. Integration Architecture

### 10.1 External Service Integration Map

```
┌─────────────────────────────────────────────┐
│              DAYMENIFY CORE                   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │         INTEGRATION LAYER            │   │
│  │                                       │   │
│  │  ┌─────────┐  ┌─────────┐           │   │
│  │  │Provider │  │Payment  │           │   │
│  │  │Adapter  │  │Adapter  │           │   │
│  │  │Interface│  │Interface│           │   │
│  │  └────┬────┘  └────┬────┘           │   │
│  │       │             │                 │   │
│  └───────┼─────────────┼─────────────────┘   │
│          │             │                      │
└──────────┼─────────────┼──────────────────────┘
           │             │
     ┌─────┼─────┐ ┌────┼─────┐
     │     │     │ │    │     │
     ▼     ▼     ▼ ▼    ▼     ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│Digi  ││VIP   ││Toko  ││Midtr ││Xendit││Tripay│
│flazz ││Resel.││vouch.││ans   ││      ││      │
└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
```

### 10.2 Adapter Pattern

Each external integration implements a common interface:

**Provider Interface:**
```typescript
interface IProviderAdapter {
  name: string;
  checkBalance(): Promise<BalanceResponse>;
  getProducts(): Promise<Product[]>;
  createOrder(params: OrderParams): Promise<OrderResponse>;
  checkOrderStatus(refId: string): Promise<StatusResponse>;
  validateCallback(payload: any, signature: string): boolean;
}
```

**Payment Interface:**
```typescript
interface IPaymentAdapter {
  name: string;
  createTransaction(params: PaymentParams): Promise<PaymentResponse>;
  checkStatus(transactionId: string): Promise<StatusResponse>;
  verifyWebhook(headers: Headers, body: any): boolean;
  getPaymentMethods(): Promise<PaymentMethod[]>;
  cancelTransaction(transactionId: string): Promise<void>;
}
```

---

*End of Document*
