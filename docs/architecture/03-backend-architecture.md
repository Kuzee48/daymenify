# Daymenify — Backend Architecture & API Planning

## Document Version
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-05-08 | Architecture Team | Draft |

---

## 1. Backend Folder Structure

```
server/
├── src/
│   ├── index.ts                    # Application entry point
│   ├── app.ts                      # Express app setup
│   ├── server.ts                   # HTTP server + Socket.io bootstrap
│   │
│   ├── config/
│   │   ├── index.ts                # Config aggregator
│   │   ├── database.ts             # PostgreSQL/Prisma config
│   │   ├── redis.ts                # Redis connection config
│   │   ├── queue.ts                # BullMQ config
│   │   ├── cors.ts                 # CORS settings
│   │   ├── jwt.ts                  # JWT secrets & options
│   │   └── providers.ts            # Provider API configs
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validator.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.validator.ts
│   │   │   ├── users.routes.ts
│   │   │   └── users.types.ts
│   │   │
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.repository.ts
│   │   │   ├── products.validator.ts
│   │   │   ├── products.routes.ts
│   │   │   └── products.types.ts
│   │   │
│   │   ├── categories/
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   ├── categories.repository.ts
│   │   │   ├── categories.validator.ts
│   │   │   ├── categories.routes.ts
│   │   │   └── categories.types.ts
│   │   │
│   │   ├── transactions/
│   │   │   ├── transactions.controller.ts
│   │   │   ├── transactions.service.ts
│   │   │   ├── transactions.repository.ts
│   │   │   ├── transactions.validator.ts
│   │   │   ├── transactions.routes.ts
│   │   │   └── transactions.types.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── payments.validator.ts
│   │   │   ├── payments.routes.ts
│   │   │   └── payments.types.ts
│   │   │
│   │   ├── providers/
│   │   │   ├── providers.controller.ts
│   │   │   ├── providers.service.ts
│   │   │   ├── providers.repository.ts
│   │   │   ├── providers.validator.ts
│   │   │   ├── providers.routes.ts
│   │   │   └── providers.types.ts
│   │   │
│   │   ├── wallets/
│   │   │   ├── wallets.controller.ts
│   │   │   ├── wallets.service.ts
│   │   │   ├── wallets.repository.ts
│   │   │   ├── wallets.validator.ts
│   │   │   ├── wallets.routes.ts
│   │   │   └── wallets.types.ts
│   │   │
│   │   ├── withdrawals/
│   │   │   ├── withdrawals.controller.ts
│   │   │   ├── withdrawals.service.ts
│   │   │   ├── withdrawals.repository.ts
│   │   │   ├── withdrawals.validator.ts
│   │   │   ├── withdrawals.routes.ts
│   │   │   └── withdrawals.types.ts
│   │   │
│   │   ├── referrals/
│   │   │   ├── referrals.controller.ts
│   │   │   ├── referrals.service.ts
│   │   │   ├── referrals.repository.ts
│   │   │   ├── referrals.routes.ts
│   │   │   └── referrals.types.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── notifications.repository.ts
│   │   │   ├── notifications.routes.ts
│   │   │   └── notifications.types.ts
│   │   │
│   │   ├── vouchers/
│   │   │   ├── vouchers.controller.ts
│   │   │   ├── vouchers.service.ts
│   │   │   ├── vouchers.repository.ts
│   │   │   ├── vouchers.validator.ts
│   │   │   ├── vouchers.routes.ts
│   │   │   └── vouchers.types.ts
│   │   │
│   │   ├── flash-sales/
│   │   │   ├── flash-sales.controller.ts
│   │   │   ├── flash-sales.service.ts
│   │   │   ├── flash-sales.repository.ts
│   │   │   ├── flash-sales.routes.ts
│   │   │   └── flash-sales.types.ts
│   │   │
│   │   ├── spin/
│   │   │   ├── spin.controller.ts
│   │   │   ├── spin.service.ts
│   │   │   ├── spin.repository.ts
│   │   │   ├── spin.routes.ts
│   │   │   └── spin.types.ts
│   │   │
│   │   ├── tickets/
│   │   │   ├── tickets.controller.ts
│   │   │   ├── tickets.service.ts
│   │   │   ├── tickets.repository.ts
│   │   │   ├── tickets.validator.ts
│   │   │   ├── tickets.routes.ts
│   │   │   └── tickets.types.ts
│   │   │
│   │   ├── cms/
│   │   │   ├── articles.controller.ts
│   │   │   ├── articles.service.ts
│   │   │   ├── banners.controller.ts
│   │   │   ├── banners.service.ts
│   │   │   ├── announcements.controller.ts
│   │   │   ├── announcements.service.ts
│   │   │   ├── cms.routes.ts
│   │   │   └── cms.types.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── dashboard.service.ts
│   │   │   └── admin.types.ts
│   │   │
│   │   ├── settings/
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.service.ts
│   │   │   ├── settings.repository.ts
│   │   │   ├── settings.routes.ts
│   │   │   └── settings.types.ts
│   │   │
│   │   └── audit/
│   │       ├── audit.controller.ts
│   │       ├── audit.service.ts
│   │       ├── audit.repository.ts
│   │       ├── audit.routes.ts
│   │       └── audit.types.ts
│   │
│   ├── services/
│   │   ├── payment/
│   │   │   ├── index.ts              # Payment service factory
│   │   │   ├── payment.interface.ts  # Common interface
│   │   │   ├── midtrans.adapter.ts
│   │   │   ├── xendit.adapter.ts
│   │   │   ├── tripay.adapter.ts
│   │   │   ├── duitku.adapter.ts
│   │   │   ├── bayargg.adapter.ts
│   │   │   └── pakasir.adapter.ts
│   │   │
│   │   ├── provider/
│   │   │   ├── index.ts              # Provider service factory
│   │   │   ├── provider.interface.ts # Common interface
│   │   │   ├── digiflazz.adapter.ts
│   │   │   ├── vipreseller.adapter.ts
│   │   │   ├── tokovoucher.adapter.ts
│   │   │   └── custom.adapter.ts
│   │   │
│   │   ├── notification/
│   │   │   ├── index.ts
│   │   │   ├── notification.interface.ts
│   │   │   ├── email.adapter.ts
│   │   │   ├── telegram.adapter.ts
│   │   │   ├── discord.adapter.ts
│   │   │   ├── push.adapter.ts
│   │   │   └── whatsapp.adapter.ts
│   │   │
│   │   ├── cache/
│   │   │   ├── cache.service.ts
│   │   │   └── cache.keys.ts
│   │   │
│   │   └── storage/
│   │       ├── storage.interface.ts
│   │       ├── local.adapter.ts
│   │       └── s3.adapter.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts        # JWT verification
│   │   ├── rbac.middleware.ts        # Role/permission check
│   │   ├── rateLimiter.middleware.ts # Rate limiting
│   │   ├── validator.middleware.ts   # Request validation
│   │   ├── errorHandler.middleware.ts# Global error handler
│   │   ├── cors.middleware.ts        # CORS configuration
│   │   ├── audit.middleware.ts       # Audit log capture
│   │   ├── requestId.middleware.ts   # Request ID injection
│   │   └── helmet.middleware.ts      # Security headers
│   │
│   ├── queues/
│   │   ├── index.ts                  # Queue registry
│   │   ├── order.queue.ts            # Order processing queue
│   │   ├── notification.queue.ts     # Notification dispatch
│   │   ├── sync.queue.ts             # Product sync queue
│   │   ├── withdrawal.queue.ts       # Withdrawal processing
│   │   └── cleanup.queue.ts          # Data cleanup jobs
│   │
│   ├── workers/
│   │   ├── index.ts                  # Worker bootstrap
│   │   ├── order.worker.ts           # Process orders
│   │   ├── notification.worker.ts    # Send notifications
│   │   ├── sync.worker.ts            # Sync products
│   │   ├── withdrawal.worker.ts      # Process withdrawals
│   │   └── cleanup.worker.ts         # Cleanup stale data
│   │
│   ├── cron/
│   │   ├── index.ts                  # Cron job registry
│   │   ├── productSync.cron.ts       # Scheduled product sync
│   │   ├── paymentExpiry.cron.ts     # Expire pending payments
│   │   ├── providerHealth.cron.ts    # Check provider status
│   │   ├── analytics.cron.ts         # Aggregate analytics
│   │   └── cleanup.cron.ts           # Clean old data
│   │
│   ├── websocket/
│   │   ├── index.ts                  # Socket.io setup
│   │   ├── namespaces/
│   │   │   ├── user.namespace.ts     # User notifications
│   │   │   ├── admin.namespace.ts    # Admin alerts
│   │   │   └── public.namespace.ts   # Live order feed
│   │   └── handlers/
│   │       ├── connection.handler.ts
│   │       └── events.handler.ts
│   │
│   ├── webhooks/
│   │   ├── index.ts                  # Webhook route registry
│   │   ├── midtrans.webhook.ts
│   │   ├── xendit.webhook.ts
│   │   ├── tripay.webhook.ts
│   │   ├── bayargg.webhook.ts
│   │   ├── digiflazz.webhook.ts
│   │   └── tokovoucher.webhook.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── redis.ts                  # Redis client
│   │   ├── logger.ts                 # Winston/Pino logger
│   │   ├── errors.ts                 # Custom error classes
│   │   ├── response.ts              # Standard response helpers
│   │   ├── pagination.ts            # Pagination utility
│   │   ├── crypto.ts                # Encryption helpers
│   │   └── helpers.ts               # General utilities
│   │
│   ├── types/
│   │   ├── express.d.ts             # Express type extensions
│   │   ├── common.types.ts          # Shared types
│   │   ├── pagination.types.ts
│   │   └── enums.ts                 # Shared enums
│   │
│   └── database/
│       ├── prisma/
│       │   ├── schema.prisma        # Database schema
│       │   ├── migrations/          # Migration files
│       │   └── seed.ts              # Seed data
│       └── redis/
│           └── lua/                  # Redis Lua scripts
│               ├── rateLimit.lua
│               └── atomicBalance.lua
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── modules/
│   │   └── lib/
│   ├── integration/
│   │   ├── api/
│   │   └── webhooks/
│   └── fixtures/
│       ├── users.fixture.ts
│       └── products.fixture.ts
│
├── .env.example
├── .env.development
├── tsconfig.json
├── package.json
├── Dockerfile
└── docker-compose.yml
```

---

## 2. Service Layer Architecture

### 2.1 Architecture Pattern

```
Controller → Service → Repository → Prisma → Database
     │           │
     │           ├── External Services (Payment/Provider adapters)
     │           ├── Cache Service (Redis)
     │           ├── Queue Service (BullMQ)
     │           └── Event Emitter (for cross-module communication)
     │
     └── Middleware Pipeline (Auth → RBAC → Validate → Rate Limit)
```

### 2.2 Layer Responsibilities

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| Controller | HTTP handling, request parsing, response formatting | No business logic, no direct DB access |
| Service | Business logic, orchestration, validation | Can call repositories, other services, external services |
| Repository | Data access, query building, transactions | Only Prisma operations, no business logic |
| Middleware | Cross-cutting concerns | Auth, validation, rate limiting, audit |
| Adapter | External service communication | Implements common interface, handles API specifics |

### 2.3 Service Communication Rules

```
✅ Controller → own Service
✅ Service → own Repository
✅ Service → other Service (via dependency injection)
✅ Service → External Adapter (payment, provider, notification)
✅ Service → Cache Service
✅ Service → Queue (for async operations)

❌ Controller → Repository directly
❌ Controller → other Controller
❌ Repository → Service
❌ Repository → External service
```



---

## 3. API Endpoint Planning

### 3.1 Public API (No Auth Required)

```
GET    /api/v1/products                    # List products (paginated, filtered)
GET    /api/v1/products/:slug              # Product detail
GET    /api/v1/products/search             # Search products
GET    /api/v1/categories                  # List categories
GET    /api/v1/categories/:slug            # Category with products
GET    /api/v1/banners                     # Active banners
GET    /api/v1/announcements               # Active announcements
GET    /api/v1/flash-sales                 # Active flash sales
GET    /api/v1/articles                    # Blog articles list
GET    /api/v1/articles/:slug              # Article detail
GET    /api/v1/transactions/check/:invoice # Transaction checker (public)
GET    /api/v1/live-feed                   # Recent orders feed (REST fallback)
GET    /api/v1/settings/public             # Public site settings
GET    /api/v1/payment-methods             # Available payment methods
```

### 3.2 Authentication API

```
POST   /api/v1/auth/register               # User registration
POST   /api/v1/auth/login                  # Login (email/phone + password)
POST   /api/v1/auth/google                 # Google OAuth login
POST   /api/v1/auth/refresh                # Refresh access token
POST   /api/v1/auth/logout                 # Logout (invalidate refresh token)
POST   /api/v1/auth/forgot-password        # Request password reset
POST   /api/v1/auth/reset-password         # Reset password with token
POST   /api/v1/auth/verify-email           # Verify email address
POST   /api/v1/auth/resend-verification    # Resend verification email
```

### 3.3 User API (Auth Required)

```
# Profile
GET    /api/v1/user/profile                # Get user profile
PUT    /api/v1/user/profile                # Update profile
PUT    /api/v1/user/password               # Change password
POST   /api/v1/user/avatar                 # Upload avatar

# Transactions
POST   /api/v1/user/transactions           # Create new transaction
GET    /api/v1/user/transactions           # List user transactions
GET    /api/v1/user/transactions/:id       # Transaction detail
GET    /api/v1/user/transactions/:id/invoice # Download invoice PDF

# Wallet
GET    /api/v1/user/wallet                 # Wallet balance & history
POST   /api/v1/user/wallet/deposit         # Create deposit
GET    /api/v1/user/wallet/history         # Wallet transaction history

# Withdrawals
POST   /api/v1/user/withdrawals            # Request withdrawal
GET    /api/v1/user/withdrawals            # Withdrawal history
GET    /api/v1/user/withdrawals/:id        # Withdrawal detail

# Referrals
GET    /api/v1/user/referral               # Referral dashboard (code, stats)
GET    /api/v1/user/referral/history       # Referral commission history
GET    /api/v1/user/referral/leaderboard   # Referral leaderboard

# Vouchers
GET    /api/v1/user/vouchers               # User's voucher inventory
POST   /api/v1/user/vouchers/redeem        # Redeem voucher code
POST   /api/v1/user/vouchers/apply         # Apply voucher to transaction

# Notifications
GET    /api/v1/user/notifications          # List notifications
PUT    /api/v1/user/notifications/:id/read # Mark as read
PUT    /api/v1/user/notifications/read-all # Mark all as read
GET    /api/v1/user/notifications/unread-count # Unread count

# Spin Wheel
GET    /api/v1/user/spin                   # Spin wheel info (tickets, rewards)
POST   /api/v1/user/spin                   # Execute spin
GET    /api/v1/user/spin/history           # Spin history

# Favorites
GET    /api/v1/user/favorites              # Favorite products
POST   /api/v1/user/favorites/:productId   # Add favorite
DELETE /api/v1/user/favorites/:productId   # Remove favorite

# Support Tickets
POST   /api/v1/user/tickets                # Create ticket
GET    /api/v1/user/tickets                # List tickets
GET    /api/v1/user/tickets/:id            # Ticket detail with messages
POST   /api/v1/user/tickets/:id/reply      # Reply to ticket
PUT    /api/v1/user/tickets/:id/close      # Close ticket
```

### 3.4 Admin API (Auth + Admin Role Required)

```
# Dashboard
GET    /api/v1/admin/dashboard             # Dashboard analytics
GET    /api/v1/admin/dashboard/revenue     # Revenue chart data
GET    /api/v1/admin/dashboard/transactions # Transaction chart
GET    /api/v1/admin/dashboard/realtime    # Realtime stats

# User Management
GET    /api/v1/admin/users                 # List users (paginated)
GET    /api/v1/admin/users/:id             # User detail
PUT    /api/v1/admin/users/:id             # Update user
PUT    /api/v1/admin/users/:id/status      # Ban/unban user
PUT    /api/v1/admin/users/:id/role        # Change user role
GET    /api/v1/admin/users/:id/transactions # User's transactions
GET    /api/v1/admin/users/:id/wallet      # User's wallet

# Product Management
GET    /api/v1/admin/products              # List all products
POST   /api/v1/admin/products              # Create product
GET    /api/v1/admin/products/:id          # Product detail
PUT    /api/v1/admin/products/:id          # Update product
DELETE /api/v1/admin/products/:id          # Delete product
PUT    /api/v1/admin/products/:id/status   # Enable/disable product
POST   /api/v1/admin/products/bulk-update  # Bulk update products
POST   /api/v1/admin/products/sync         # Trigger manual sync

# Category Management
GET    /api/v1/admin/categories            # List categories
POST   /api/v1/admin/categories            # Create category
PUT    /api/v1/admin/categories/:id        # Update category
DELETE /api/v1/admin/categories/:id        # Delete category
PUT    /api/v1/admin/categories/:id/order  # Reorder category

# Transaction Management
GET    /api/v1/admin/transactions          # List all transactions
GET    /api/v1/admin/transactions/:id      # Transaction detail + logs
PUT    /api/v1/admin/transactions/:id/status # Manual status update
POST   /api/v1/admin/transactions/:id/retry # Retry failed transaction
POST   /api/v1/admin/transactions/:id/refund # Process refund

# Provider Management
GET    /api/v1/admin/providers             # List providers
POST   /api/v1/admin/providers             # Add provider
PUT    /api/v1/admin/providers/:id         # Update provider config
PUT    /api/v1/admin/providers/:id/status  # Enable/disable provider
GET    /api/v1/admin/providers/:id/health  # Provider health status
POST   /api/v1/admin/providers/:id/sync    # Sync products from provider
GET    /api/v1/admin/providers/:id/products # Provider's products
GET    /api/v1/admin/providers/balance     # All provider balances

# Payment Gateway Management
GET    /api/v1/admin/gateways              # List payment gateways
POST   /api/v1/admin/gateways             # Add gateway
PUT    /api/v1/admin/gateways/:id         # Update gateway config
PUT    /api/v1/admin/gateways/:id/status  # Enable/disable gateway
GET    /api/v1/admin/gateways/:id/health  # Gateway health

# Pricing & Markup
GET    /api/v1/admin/markup                # Get markup rules
POST   /api/v1/admin/markup                # Create markup rule
PUT    /api/v1/admin/markup/:id            # Update markup rule
DELETE /api/v1/admin/markup/:id            # Delete markup rule
POST   /api/v1/admin/markup/recalculate    # Recalculate all prices

# Withdrawal Management
GET    /api/v1/admin/withdrawals           # List pending withdrawals
PUT    /api/v1/admin/withdrawals/:id/approve # Approve withdrawal
PUT    /api/v1/admin/withdrawals/:id/reject  # Reject withdrawal

# Voucher Management
GET    /api/v1/admin/vouchers              # List vouchers
POST   /api/v1/admin/vouchers             # Create voucher
PUT    /api/v1/admin/vouchers/:id         # Update voucher
DELETE /api/v1/admin/vouchers/:id         # Delete voucher
GET    /api/v1/admin/vouchers/:id/usage   # Voucher usage stats

# Flash Sale Management
GET    /api/v1/admin/flash-sales           # List flash sales
POST   /api/v1/admin/flash-sales          # Create flash sale
PUT    /api/v1/admin/flash-sales/:id      # Update flash sale
DELETE /api/v1/admin/flash-sales/:id      # Delete flash sale

# Spin Wheel Management
GET    /api/v1/admin/spin/config           # Spin wheel configuration
PUT    /api/v1/admin/spin/config           # Update spin config
GET    /api/v1/admin/spin/rewards          # List rewards
POST   /api/v1/admin/spin/rewards          # Add reward
PUT    /api/v1/admin/spin/rewards/:id      # Update reward
GET    /api/v1/admin/spin/analytics        # Spin analytics

# CMS Management
GET    /api/v1/admin/banners               # List banners
POST   /api/v1/admin/banners              # Create banner
PUT    /api/v1/admin/banners/:id          # Update banner
DELETE /api/v1/admin/banners/:id          # Delete banner

GET    /api/v1/admin/articles              # List articles
POST   /api/v1/admin/articles             # Create article
PUT    /api/v1/admin/articles/:id         # Update article
DELETE /api/v1/admin/articles/:id         # Delete article

GET    /api/v1/admin/announcements         # List announcements
POST   /api/v1/admin/announcements        # Create announcement
PUT    /api/v1/admin/announcements/:id    # Update announcement
DELETE /api/v1/admin/announcements/:id    # Delete announcement

# Support Ticket Management
GET    /api/v1/admin/tickets               # List all tickets
GET    /api/v1/admin/tickets/:id           # Ticket detail
POST   /api/v1/admin/tickets/:id/reply     # Admin reply
PUT    /api/v1/admin/tickets/:id/assign    # Assign to admin
PUT    /api/v1/admin/tickets/:id/status    # Update status

# Referral Management
GET    /api/v1/admin/referrals             # Referral overview
GET    /api/v1/admin/referrals/stats       # Referral statistics
PUT    /api/v1/admin/referrals/config      # Update referral config

# Seasonal Events
GET    /api/v1/admin/events                # List events
POST   /api/v1/admin/events               # Create event
PUT    /api/v1/admin/events/:id           # Update event
DELETE /api/v1/admin/events/:id           # Delete event

# Notifications
POST   /api/v1/admin/notifications/broadcast # Broadcast notification
GET    /api/v1/admin/notifications/templates # Notification templates
PUT    /api/v1/admin/notifications/templates/:id # Update template

# Settings
GET    /api/v1/admin/settings              # All settings
PUT    /api/v1/admin/settings              # Update settings
GET    /api/v1/admin/settings/maintenance  # Maintenance config
PUT    /api/v1/admin/settings/maintenance  # Toggle maintenance

# Audit Logs
GET    /api/v1/admin/audit-logs            # List audit logs
GET    /api/v1/admin/audit-logs/export     # Export logs (CSV)

# Roles & Permissions
GET    /api/v1/admin/roles                 # List roles
POST   /api/v1/admin/roles                # Create role
PUT    /api/v1/admin/roles/:id            # Update role
DELETE /api/v1/admin/roles/:id            # Delete role
GET    /api/v1/admin/permissions           # List all permissions
```

### 3.5 Webhook Endpoints (External → System)

```
POST   /api/v1/webhook/midtrans            # Midtrans payment callback
POST   /api/v1/webhook/xendit              # Xendit payment callback
POST   /api/v1/webhook/tripay              # Tripay payment callback
POST   /api/v1/webhook/duitku              # Duitku payment callback
POST   /api/v1/webhook/bayargg             # Bayar.gg payment callback
POST   /api/v1/webhook/pakasir             # Pakasir payment callback
POST   /api/v1/webhook/digiflazz           # Digiflazz order callback
POST   /api/v1/webhook/tokovoucher         # Tokovoucher order callback
POST   /api/v1/webhook/vipreseller         # VIP-Reseller callback
```

---

## 4. API Design Standards

### 4.1 Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "code": "VALIDATION_ERROR",
  "requestId": "req_abc123"
}
```

### 4.2 HTTP Status Code Usage

| Status | Usage |
|--------|-------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request / Validation error |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (insufficient permission) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable entity (business logic error) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (maintenance) |

### 4.3 Pagination Standard

```
GET /api/v1/products?page=1&limit=20&sort=createdAt&order=desc
GET /api/v1/products?page=2&limit=50&sort=price&order=asc
```

### 4.4 Filtering Standard

```
GET /api/v1/products?categoryId=uuid&status=active&minPrice=10000&maxPrice=100000
GET /api/v1/admin/transactions?status=pending&gateway=midtrans&dateFrom=2026-01-01&dateTo=2026-01-31
```

### 4.5 Search Standard

```
GET /api/v1/products/search?q=mobile+legends&category=game-topup&limit=10
```

### 4.6 Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1716825600
Retry-After: 60 (when 429)
```

---

## 5. Middleware Pipeline

### 5.1 Request Flow

```
Incoming Request
      │
      ▼
┌─────────────┐
│  Request ID │  → Assign unique ID for tracing
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Helmet    │  → Security headers
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    CORS     │  → Origin validation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Rate Limiter│  → IP/user-based throttling
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Body Parser │  → JSON/form parsing
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Auth     │  → JWT verification (if protected route)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    RBAC     │  → Permission check (if admin route)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Validator  │  → Request body/params validation (Zod)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │  → Handle request
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Audit     │  → Log admin actions (post-response)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Error Handler│  → Catch & format any thrown errors
└─────────────┘
```

### 5.2 Rate Limiting Strategy

| Endpoint Group | Limit | Window | Key |
|----------------|-------|--------|-----|
| Public API | 100 req | 1 min | IP |
| Auth (login/register) | 5 req | 15 min | IP |
| Auth (forgot password) | 3 req | 1 hour | IP + email |
| User API | 60 req | 1 min | User ID |
| Create Transaction | 10 req | 1 min | User ID |
| Webhook endpoints | 500 req | 1 min | IP |
| Admin API | 200 req | 1 min | User ID |
| File Upload | 10 req | 5 min | User ID |

---

## 6. Error Handling Architecture

### 6.1 Custom Error Classes

```typescript
// Base application error
class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
}

// Specific errors
class ValidationError extends AppError { statusCode = 400 }
class AuthenticationError extends AppError { statusCode = 401 }
class AuthorizationError extends AppError { statusCode = 403 }
class NotFoundError extends AppError { statusCode = 404 }
class ConflictError extends AppError { statusCode = 409 }
class BusinessLogicError extends AppError { statusCode = 422 }
class RateLimitError extends AppError { statusCode = 429 }
class ExternalServiceError extends AppError { statusCode = 502 }
class MaintenanceError extends AppError { statusCode = 503 }
```

### 6.2 Global Error Handler

```typescript
// Catches all errors from controllers
// Formats into standard error response
// Logs error details (not exposed to client)
// Differentiates operational vs programming errors
// Sends alert for critical errors
```

---

## 7. Dependency Injection Pattern

### 7.1 Service Factory

```typescript
// Simple DI without framework overhead
// Services instantiated at app startup
// Dependencies passed via constructor

class TransactionService {
  constructor(
    private transactionRepo: TransactionRepository,
    private paymentService: PaymentService,
    private providerService: ProviderService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private queueService: QueueService,
    private cacheService: CacheService,
  ) {}
}
```

### 7.2 Container Setup

```typescript
// src/container.ts
// Initialize all repositories
// Initialize all services with dependencies
// Export service instances for controllers
// Singleton pattern for shared services (cache, queue, etc.)
```

---

## 8. Validation Strategy

### 8.1 Validation Library: Zod

**Why Zod?**
- TypeScript-first with type inference
- Runtime validation + compile-time types
- Composable schemas
- Custom error messages
- Transform/coerce capabilities

### 8.2 Validation Locations

| Location | What's Validated |
|----------|-----------------|
| Middleware (Zod) | Request body, params, query structure |
| Service Layer | Business rules, cross-field validation |
| Repository | Data integrity before DB write |
| Webhook Handler | Signature verification, payload structure |

### 8.3 Example Schema Pattern

```typescript
// products.validator.ts
const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    categoryId: z.string().uuid(),
    providerId: z.string().uuid(),
    providerCode: z.string(),
    basePrice: z.number().positive(),
    status: z.enum(['active', 'inactive']),
    metadata: z.record(z.any()).optional(),
  }),
});
```

---

## 9. Logging Architecture

### 9.1 Logger: Pino (recommended) or Winston

**Why Pino?**
- 5x faster than Winston (important for high-throughput)
- JSON-native output
- Low overhead
- Built-in request serialization
- Child loggers for context

### 9.2 Log Structure

```json
{
  "level": "info",
  "timestamp": "2026-05-08T10:30:00.000Z",
  "requestId": "req_abc123",
  "userId": "usr_xyz789",
  "module": "transaction",
  "action": "create_order",
  "message": "Transaction created successfully",
  "data": {
    "transactionId": "txn_001",
    "amount": 50000,
    "provider": "digiflazz"
  },
  "duration": 245
}
```

### 9.3 Log Destinations

| Environment | Destination |
|-------------|-------------|
| Development | Console (pretty-printed) |
| Production | File (JSON) + stdout (for Docker) |
| Future | ELK Stack / Grafana Loki |

---

*End of Document*
