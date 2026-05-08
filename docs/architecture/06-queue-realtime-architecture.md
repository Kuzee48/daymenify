# Daymenify — Queue, Realtime & Event Architecture

## Document Version
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-05-08 | Architecture Team | Draft |

---

## 1. Queue Architecture (BullMQ)

### 1.1 Queue Overview

BullMQ is the backbone for all asynchronous processing. Every non-instant operation flows through queues to ensure reliability, retryability, and scalability.

```
┌─────────────────────────────────────────────────────────────┐
│                      QUEUE SYSTEM                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ order-queue  │  │ sync-queue   │  │ notif-queue  │      │
│  │              │  │              │  │              │      │
│  │ Process paid │  │ Product sync │  │ Multi-channel│      │
│  │ orders via   │  │ from all     │  │ notification │      │
│  │ providers    │  │ providers    │  │ dispatch     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │withdraw-queue│  │ cleanup-queue│  │ analytics-q  │      │
│  │              │  │              │  │              │      │
│  │ Process      │  │ Expire stale │  │ Aggregate    │      │
│  │ withdrawal   │  │ data, tokens │  │ daily stats  │      │
│  │ requests     │  │ sessions     │  │ & reports    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ webhook-queue│  │ email-queue  │                        │
│  │              │  │              │                        │
│  │ Retry failed │  │ Transactional│                        │
│  │ webhook      │  │ email send   │                        │
│  │ deliveries   │  │              │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Queue Definitions

| Queue Name | Purpose | Concurrency | Priority |
|------------|---------|-------------|----------|
| `order-processing` | Process paid orders via provider API | 5 | High |
| `product-sync` | Sync products from provider APIs | 2 | Low |
| `notification-dispatch` | Send notifications (email, telegram, push) | 10 | Medium |
| `withdrawal-processing` | Process approved withdrawals | 2 | High |
| `cleanup` | Expire tokens, sessions, stale data | 1 | Low |
| `analytics-aggregation` | Aggregate daily/weekly stats | 1 | Low |
| `webhook-retry` | Retry failed outgoing webhooks | 3 | Medium |
| `email-send` | Transactional email delivery | 5 | Medium |
| `price-recalculation` | Bulk price updates after markup change | 1 | Low |

### 1.3 Order Processing Queue (Critical Path)

```typescript
// queues/order.queue.ts
interface OrderJobData {
  transactionId: string;
  productId: string;
  providerId?: string; // Pre-selected or auto-route
  customerData: Record<string, string>;
  attemptNumber: number;
  maxAttempts: number;
}

// Queue configuration
const orderQueue = new Queue('order-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 25s, 125s
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    priority: 1,
  },
});
```

### 1.4 Order Worker Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ORDER WORKER FLOW                          │
│                                                              │
│  Job received                                                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────┐                                        │
│  │ Validate order  │ ── (invalid) ──▶ Mark FAILED, notify   │
│  │ still PAID      │                                         │
│  └────────┬────────┘                                        │
│           │ (valid)                                           │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ Select provider │ ── Smart routing (priority, health,    │
│  │ (routing logic) │    price, availability)                 │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ Update status:  │                                        │
│  │ PROCESSING      │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ Call provider   │                                        │
│  │ API (adapter)   │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│      ┌────┴────┐                                            │
│      │         │                                             │
│  (success)  (failure)                                        │
│      │         │                                             │
│      ▼         ▼                                             │
│  ┌────────┐ ┌──────────────────┐                            │
│  │Complete│ │ Check fallback   │                            │
│  │ order  │ │ providers        │                            │
│  │        │ └────────┬─────────┘                            │
│  │Emit:   │          │                                      │
│  │notify  │     ┌────┴────┐                                 │
│  │event   │     │         │                                  │
│  └────────┘ (fallback) (no more)                            │
│                 │         │                                   │
│                 ▼         ▼                                   │
│            ┌────────┐ ┌────────────┐                        │
│            │ Retry  │ │ Mark FAILED│                        │
│            │ with   │ │ Notify     │                        │
│            │ next   │ │ admin      │                        │
│            │provider│ │ Refund?    │                        │
│            └────────┘ └────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.5 Product Sync Queue

```typescript
// queues/sync.queue.ts
interface SyncJobData {
  providerId: string;
  providerCode: string; // digiflazz, vipreseller, etc.
  syncType: 'full' | 'incremental' | 'price_only';
  triggeredBy: 'cron' | 'admin' | 'webhook';
}

// Sync worker steps:
// 1. Fetch all products from provider API (paginated)
// 2. Compare with existing provider_products records
// 3. INSERT new products (deduplication by providerCode)
// 4. UPDATE changed prices
// 5. DISABLE products no longer in provider response
// 6. Recalculate selling prices (apply markup rules)
// 7. Invalidate Redis cache for affected products
// 8. Log sync results (new: X, updated: X, disabled: X)
// 9. Emit sync-complete event
```

### 1.6 Notification Dispatch Queue

```typescript
// queues/notification.queue.ts
interface NotificationJobData {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel; // IN_APP, EMAIL, TELEGRAM, PUSH, DISCORD
  title: string;
  message: string;
  data?: Record<string, any>; // Action data
  templateId?: string;
  templateVars?: Record<string, string>;
}

// Worker dispatches to appropriate adapter:
// - IN_APP: Save to DB + emit via Socket.io
// - EMAIL: Send via SMTP/Resend/SendGrid
// - TELEGRAM: Send via Telegram Bot API
// - PUSH: Send via FCM/Web Push
// - DISCORD: Send via Discord Webhook
```

### 1.7 Scheduled Jobs (Repeatable/Cron)

```typescript
// cron/index.ts - Scheduled job registry

const scheduledJobs = [
  {
    name: 'product-sync-digiflazz',
    cron: '*/30 * * * *', // Every 30 minutes
    queue: 'product-sync',
    data: { providerId: 'xxx', syncType: 'price_only' },
  },
  {
    name: 'product-sync-full',
    cron: '0 3 * * *', // Daily at 3 AM
    queue: 'product-sync',
    data: { syncType: 'full' },
  },
  {
    name: 'payment-expiry-check',
    cron: '*/5 * * * *', // Every 5 minutes
    queue: 'cleanup',
    data: { task: 'expire-pending-payments' },
  },
  {
    name: 'provider-health-check',
    cron: '*/2 * * * *', // Every 2 minutes
    queue: 'cleanup',
    data: { task: 'check-provider-health' },
  },
  {
    name: 'session-cleanup',
    cron: '0 4 * * *', // Daily at 4 AM
    queue: 'cleanup',
    data: { task: 'cleanup-expired-sessions' },
  },
  {
    name: 'daily-analytics',
    cron: '0 1 * * *', // Daily at 1 AM
    queue: 'analytics-aggregation',
    data: { period: 'daily' },
  },
  {
    name: 'pending-order-checker',
    cron: '*/3 * * * *', // Every 3 minutes
    queue: 'order-processing',
    data: { task: 'check-stuck-orders' },
  },
  {
    name: 'flash-sale-activation',
    cron: '* * * * *', // Every minute
    queue: 'cleanup',
    data: { task: 'activate-deactivate-flash-sales' },
  },
];
```

### 1.8 Queue Monitoring (Bull Board)

```typescript
// Exposed at /admin/queues (protected by admin auth)
// Features:
// - View all queues and their status
// - See pending, active, completed, failed job counts
// - Retry failed jobs manually
// - View job data and error details
// - Pause/resume queues
// - Clean completed/failed jobs
```

### 1.9 Dead Letter Queue Strategy

```
Failed Job (after max retries)
        │
        ▼
┌──────────────────────┐
│  Move to DLQ table   │
│  (dead_letter_jobs)  │
│                      │
│  - Original job data │
│  - Error message     │
│  - Retry count       │
│  - Timestamp         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Alert admin         │
│  (Telegram + Discord)│
│                      │
│  "Order TXN-001      │
│   failed after 3     │
│   attempts. Provider │
│   Digiflazz timeout" │
└──────────────────────┘
```

---

## 2. Realtime Architecture (Socket.io)

### 2.1 Socket.io Server Setup

```typescript
// websocket/index.ts
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  adapter: createAdapter(pubClient, subClient), // Redis adapter for scaling
});

// Namespaces
const publicNsp = io.of('/public');   // No auth required
const userNsp = io.of('/user');       // User auth required
const adminNsp = io.of('/admin');     // Admin auth required
```

### 2.2 Namespace Design

```
┌─────────────────────────────────────────────────────────┐
│                    SOCKET.IO SERVER                       │
│                                                          │
│  /public (no auth)                                       │
│  ├── Events emitted:                                     │
│  │   ├── feed:new-order      (live order feed)          │
│  │   ├── flash-sale:update   (stock/countdown)          │
│  │   └── maintenance:toggle  (maintenance mode)         │
│  │                                                       │
│  /user (JWT auth)                                        │
│  ├── Room: user:{userId}                                │
│  ├── Events emitted:                                     │
│  │   ├── transaction:status  (order status update)      │
│  │   ├── notification:new    (new notification)         │
│  │   ├── wallet:update       (balance changed)          │
│  │   ├── ticket:reply        (support reply)            │
│  │   └── spin:result         (spin wheel result)        │
│  │                                                       │
│  /admin (Admin JWT auth)                                 │
│  ├── Room: admin:all                                    │
│  ├── Events emitted:                                     │
│  │   ├── admin:new-transaction  (new order placed)      │
│  │   ├── admin:payment-received (payment confirmed)     │
│  │   ├── admin:order-failed     (provider error)        │
│  │   ├── admin:withdrawal-req   (new withdrawal)        │
│  │   ├── admin:ticket-created   (new support ticket)    │
│  │   ├── admin:provider-down    (provider health fail)  │
│  │   ├── admin:fraud-alert      (suspicious activity)   │
│  │   ├── admin:stats-update     (realtime dashboard)    │
│  │   └── admin:gateway-error    (payment gateway issue) │
│  │                                                       │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Authentication Middleware (Socket)

```typescript
// websocket/middleware/auth.ts
userNsp.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('No token provided');
    
    const payload = verifyJWT(token);
    const user = await getUserById(payload.userId);
    if (!user) throw new Error('User not found');
    
    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

// On connection, join user-specific room
userNsp.on('connection', (socket) => {
  const userId = socket.data.user.id;
  socket.join(`user:${userId}`);
  
  // Update online status
  redis.set(`online:${userId}`, '1', 'EX', 300);
});
```

### 2.4 Live Order Feed System

```typescript
// How live order feed works:

// 1. Transaction completes (in order worker)
// 2. Worker emits event:
orderWorker.on('completed', async (job) => {
  const tx = await getTransaction(job.data.transactionId);
  
  // Emit to public namespace
  io.of('/public').emit('feed:new-order', {
    id: tx.id,
    username: maskUsername(tx.user.name), // "Ri***" 
    product: tx.productName,
    denomination: tx.denomination,
    timestamp: new Date().toISOString(),
  });
});

// 3. Frontend displays with animation
// "Ri*** baru saja topup 344 Diamond Mobile Legends"
// Auto-scrolling, limited to last 20 items
```

### 2.5 Realtime Dashboard Stats

```typescript
// Admin dashboard receives realtime updates
// Pattern: Aggregate in Redis, push every 5 seconds

// Cron: every 5 seconds (via setInterval in Socket server)
setInterval(async () => {
  const stats = {
    todayRevenue: await redis.get('stats:today:revenue'),
    todayOrders: await redis.get('stats:today:orders'),
    activeUsers: await redis.scard('online:users'),
    pendingOrders: await redis.get('stats:pending:orders'),
    queueDepth: await getQueueDepths(),
  };
  
  io.of('/admin').to('admin:all').emit('admin:stats-update', stats);
}, 5000);
```

### 2.6 Connection Management

| Scenario | Handling |
|----------|----------|
| User disconnects | Remove from room, update last_seen |
| Token expired | Client auto-refreshes, reconnects |
| Server restart | Clients auto-reconnect (Socket.io built-in) |
| Multiple tabs | Same user joins room, receives once per room |
| Network flap | Exponential backoff reconnection |
| Redis failure | Graceful degradation (local events only) |

### 2.7 Scaling with Redis Adapter

```typescript
// For horizontal scaling (multiple Socket.io instances)
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// All instances share events through Redis Pub/Sub
// Any instance can emit to any user regardless of which
// instance they're connected to
```

---

## 3. Event-Driven Architecture

### 3.1 Internal Event System

```typescript
// lib/events.ts
// Node.js EventEmitter for in-process event communication
// Used for decoupling modules without queue overhead

import { EventEmitter } from 'events';

class AppEventBus extends EventEmitter {
  // Typed events for safety
  emitTransactionCompleted(data: TransactionCompletedEvent): void;
  emitPaymentReceived(data: PaymentReceivedEvent): void;
  emitUserRegistered(data: UserRegisteredEvent): void;
  emitWithdrawalRequested(data: WithdrawalRequestedEvent): void;
  emitProviderDown(data: ProviderDownEvent): void;
}

export const eventBus = new AppEventBus();
```

### 3.2 Event Catalog

| Event | Emitted By | Consumed By |
|-------|-----------|-------------|
| `transaction.created` | Transaction Service | Notification, Audit |
| `transaction.paid` | Payment Webhook | Order Queue, Notification |
| `transaction.completed` | Order Worker | Notification, Referral, Cashback, Socket |
| `transaction.failed` | Order Worker | Notification, Admin Alert, Refund |
| `payment.received` | Webhook Handler | Transaction Service, Wallet |
| `payment.expired` | Expiry Cron | Transaction Service, Notification |
| `user.registered` | Auth Service | Wallet (create), Referral (link), Notification |
| `user.login` | Auth Service | Audit Log |
| `withdrawal.requested` | Withdrawal Service | Admin Notification |
| `withdrawal.approved` | Admin Action | Withdrawal Queue, Notification |
| `provider.health.changed` | Health Checker | Admin Alert, Router (disable) |
| `product.sync.completed` | Sync Worker | Cache Invalidation, Admin Notification |
| `flash-sale.started` | Flash Sale Cron | Socket (public), Cache |
| `flash-sale.ended` | Flash Sale Cron | Socket (public), Cache |
| `referral.commission.earned` | Referral Service | Wallet, Notification |
| `spin.completed` | Spin Service | Wallet, Notification, Socket |
| `ticket.created` | Ticket Service | Admin Notification |
| `ticket.replied` | Ticket Service | User Notification |

### 3.3 Event Flow Example: Transaction Completion

```
Transaction completed in Order Worker
        │
        ├──▶ eventBus.emit('transaction.completed', { txId, userId, amount })
        │
        ├──▶ [Notification Listener]
        │    └── Queue notification job (in-app + email)
        │
        ├──▶ [Referral Listener]
        │    └── Calculate & credit referrer commission
        │
        ├──▶ [Cashback Listener]
        │    └── Calculate & credit cashback to wallet
        │
        ├──▶ [Socket Listener]
        │    ├── Emit to user room (transaction:status → COMPLETED)
        │    ├── Emit to public feed (feed:new-order)
        │    └── Emit to admin (admin:new-transaction)
        │
        ├──▶ [Analytics Listener]
        │    └── Increment Redis counters (revenue, orders)
        │
        └──▶ [Audit Listener]
             └── Write audit log entry
```

### 3.4 Event vs Queue Decision Matrix

| Criteria | Use Event (EventEmitter) | Use Queue (BullMQ) |
|----------|--------------------------|---------------------|
| Latency requirement | < 100ms | Can wait seconds/minutes |
| Failure tolerance | Can afford to miss | Must not miss (persistent) |
| Processing time | < 50ms | Any duration |
| Retry needed | No | Yes |
| Cross-process | No (same process) | Yes (distributed) |
| Examples | Audit log, cache invalidation | Order processing, email send |

---

## 4. Webhook Architecture

### 4.1 Incoming Webhook Flow

```
External Service (Midtrans/Xendit/Provider)
              │
              ▼
┌─────────────────────────────┐
│  POST /api/v1/webhook/{src} │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  1. Log raw webhook         │  ← Always log FIRST
│     (webhook_logs table)    │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  2. Verify signature        │  ← Reject if invalid
│     (per gateway/provider)  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  3. Idempotency check       │  ← Skip if already processed
│     (Redis: webhook:{id})   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  4. Parse & validate        │
│     payload structure       │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  5. Process business logic  │
│     (update payment/order)  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  6. Respond 200 OK          │  ← Always respond quickly
│     (< 5 seconds)           │
└─────────────────────────────┘
```

### 4.2 Idempotency Implementation

```typescript
// Prevent duplicate webhook processing
async function checkIdempotency(webhookId: string, source: string): Promise<boolean> {
  const key = `webhook:processed:${source}:${webhookId}`;
  const result = await redis.set(key, '1', 'NX', 'EX', 86400); // 24h TTL
  return result === 'OK'; // true = first time, false = duplicate
}

// Usage in webhook handler:
const isNew = await checkIdempotency(payload.id, 'midtrans');
if (!isNew) {
  logger.warn('Duplicate webhook received', { id: payload.id });
  return res.status(200).json({ status: 'already_processed' });
}
```

### 4.3 Webhook Retry (Outgoing)

For cases where Daymenify needs to notify external systems:

```typescript
// Outgoing webhook retry strategy
const retrySchedule = [
  { delay: 60000 },      // 1 minute
  { delay: 300000 },     // 5 minutes
  { delay: 1800000 },    // 30 minutes
  { delay: 7200000 },    // 2 hours
  { delay: 43200000 },   // 12 hours
];

// After all retries exhausted → DLQ + admin alert
```

---

## 5. Caching Architecture

### 5.1 Cache Layers

```
Request → Check Redis Cache → (hit) → Return cached data
                │
            (miss)
                │
                ▼
        Query Database → Store in Redis → Return data
```

### 5.2 Cache Key Patterns

```typescript
// Cache key naming convention: {module}:{entity}:{identifier}

const CACHE_KEYS = {
  // Products
  PRODUCT_BY_SLUG: (slug: string) => `product:slug:${slug}`,
  PRODUCTS_BY_CATEGORY: (catId: string, page: number) => `products:cat:${catId}:p${page}`,
  PRODUCT_PRICES: (productId: string) => `product:prices:${productId}`,
  POPULAR_PRODUCTS: 'products:popular',
  
  // Categories
  CATEGORIES_TREE: 'categories:tree',
  CATEGORY_BY_SLUG: (slug: string) => `category:slug:${slug}`,
  
  // Settings
  SITE_SETTINGS: 'settings:site',
  PAYMENT_METHODS: 'settings:payment-methods',
  ACTIVE_BANNERS: 'cms:banners:active',
  ACTIVE_ANNOUNCEMENTS: 'cms:announcements:active',
  
  // Flash Sale
  ACTIVE_FLASH_SALE: 'flash-sale:active',
  FLASH_SALE_STOCK: (fsProductId: string) => `flash-sale:stock:${fsProductId}`,
  
  // Provider
  PROVIDER_HEALTH: (providerId: string) => `provider:health:${providerId}`,
  PROVIDER_BALANCE: (providerId: string) => `provider:balance:${providerId}`,
  
  // Rate Limiting
  RATE_LIMIT: (key: string) => `ratelimit:${key}`,
  
  // Sessions
  USER_SESSION: (userId: string) => `session:${userId}`,
  
  // Realtime
  ONLINE_USERS: 'online:users',
  LIVE_FEED: 'feed:orders:recent',
};
```

### 5.3 Cache TTL Strategy

| Data Type | TTL | Invalidation |
|-----------|-----|-------------|
| Product details | 5 min | On product update, sync |
| Category tree | 30 min | On category CRUD |
| Site settings | 10 min | On settings update |
| Payment methods | 15 min | On gateway config change |
| Active banners | 10 min | On banner CRUD |
| Flash sale data | 30 sec | On stock change |
| Provider health | 2 min | On health check |
| Popular products | 5 min | On transaction complete |
| User session | 15 min (sliding) | On logout, token refresh |
| Live feed | 5 min (list) | Auto-trim to 50 items |
| Rate limit counters | 1-15 min | Auto-expire |

### 5.4 Cache Invalidation Patterns

```typescript
// Pattern 1: Direct invalidation (on write)
async function updateProduct(id: string, data: UpdateProductDTO) {
  const product = await productRepo.update(id, data);
  await cache.del(CACHE_KEYS.PRODUCT_BY_SLUG(product.slug));
  await cache.del(CACHE_KEYS.PRODUCTS_BY_CATEGORY(product.categoryId, 1));
  await cache.del(CACHE_KEYS.POPULAR_PRODUCTS);
  return product;
}

// Pattern 2: Tag-based invalidation
// Tag products with category, invalidate all by tag
await cache.invalidateByTag(`category:${categoryId}`);

// Pattern 3: TTL-based expiry (for non-critical data)
// Let cache expire naturally, accept brief staleness
```

---

## 6. Background Job Monitoring

### 6.1 Bull Board Dashboard

```
URL: /admin/queues (admin-only access)

Features:
- Queue overview (pending/active/completed/failed counts)
- Job inspection (view data, stacktrace, logs)
- Manual retry for failed jobs
- Pause/resume queues
- Clean old jobs
- Queue metrics (throughput, latency)
```

### 6.2 Queue Health Metrics

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Pending jobs (order) | > 50 | > 200 |
| Pending jobs (sync) | > 10 | > 50 |
| Pending jobs (notification) | > 100 | > 500 |
| Failed jobs (last hour) | > 10 | > 50 |
| Average job duration (order) | > 10s | > 30s |
| Dead letter queue size | > 5 | > 20 |

### 6.3 Alerting on Queue Issues

```typescript
// Monitor queue health every minute
setInterval(async () => {
  const orderQueue = queues.get('order-processing');
  const waiting = await orderQueue.getWaitingCount();
  const failed = await orderQueue.getFailedCount();
  
  if (waiting > 200) {
    await alertAdmin({
      severity: 'critical',
      message: `Order queue backing up: ${waiting} pending jobs`,
      channel: ['telegram', 'discord'],
    });
  }
  
  if (failed > 50) {
    await alertAdmin({
      severity: 'high',
      message: `High failure rate in order queue: ${failed} failed in last hour`,
      channel: ['telegram'],
    });
  }
}, 60000);
```

---

*End of Document*
