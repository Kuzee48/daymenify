# Daymenify — Security, RBAC & Fraud Prevention

## Document Version
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-05-08 | Architecture Team | Draft |

---

## 1. Authentication Architecture

### 1.1 JWT Token Strategy

```
┌─────────────────────────────────────────────────────┐
│              TOKEN ARCHITECTURE                       │
│                                                      │
│  Access Token (short-lived):                         │
│  ├── Algorithm: RS256 (asymmetric)                   │
│  ├── TTL: 15 minutes                                │
│  ├── Stored: Memory (Zustand) + httpOnly cookie      │
│  ├── Payload: { userId, role, permissions[] }        │
│  └── Refresh: Silent refresh before expiry           │
│                                                      │
│  Refresh Token (long-lived):                         │
│  ├── Format: Opaque (random UUID v4)                 │
│  ├── TTL: 7 days (30 days for "remember me")        │
│  ├── Stored: httpOnly, Secure, SameSite=Strict       │
│  ├── Database: refresh_tokens table                  │
│  └── Rotation: New token issued on each refresh      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 1.2 Token Rotation Flow

```
1. User logs in
   → Server creates Access Token (15min) + Refresh Token (7d)
   → Refresh Token stored in DB with family_id
   → Both returned (AT in body, RT in httpOnly cookie)

2. Access Token expires (after 15 min)
   → Client detects 401 or preemptive refresh
   → Client sends Refresh Token to /api/v1/auth/refresh

3. Server validates Refresh Token
   → Check: exists in DB, not revoked, not expired
   → If valid:
     → Generate new Access Token
     → Generate new Refresh Token
     → Mark old Refresh Token as "used" (replacedBy = new token)
     → Return new tokens to client
   → If invalid (reuse detected):
     → Revoke ALL tokens in the family (security breach)
     → Force re-login
     → Alert admin (potential token theft)

4. User logs out
   → Revoke current Refresh Token
   → Clear httpOnly cookie
   → Optionally revoke all user's refresh tokens
```

### 1.3 Access Token Payload

```typescript
interface JWTPayload {
  sub: string;           // User ID
  email: string;
  role: string;          // Role name (admin, user, super_admin)
  permissions: string[]; // ['products.read', 'transactions.create']
  iat: number;           // Issued at
  exp: number;           // Expires at
  jti: string;           // Unique token ID (for blacklisting)
}
```

### 1.4 Google OAuth Flow

```
1. User clicks "Login with Google"
2. Frontend redirects to Google OAuth consent screen
3. Google redirects back with authorization code
4. Frontend sends code to /api/v1/auth/google
5. Backend exchanges code for Google tokens
6. Backend fetches user profile from Google
7. Backend finds or creates user (by googleId or email)
8. Backend issues our JWT tokens (same as normal login)
9. Return tokens to frontend
```

### 1.5 Password Security

```typescript
// Password requirements
const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Indonesian users find this frustrating
};

// Hashing: bcrypt with cost factor 12
const BCRYPT_ROUNDS = 12;
const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

// Password reset flow:
// 1. User requests reset → generate random token (32 bytes hex)
// 2. Store hashed token in DB with 1-hour expiry
// 3. Send email with reset link containing plain token
// 4. User submits new password + token
// 5. Verify token hash matches → update password
// 6. Invalidate all refresh tokens (force re-login everywhere)
```

---

## 2. RBAC (Role-Based Access Control)

### 2.1 Role Hierarchy

```
┌─────────────────────────────────────────────┐
│            ROLE HIERARCHY                     │
│                                              │
│  SUPER_ADMIN (system owner)                  │
│  ├── Full access to everything               │
│  ├── Can manage other admins                 │
│  ├── Can modify system settings              │
│  ├── Can access audit logs                   │
│  └── Cannot be deleted                       │
│                                              │
│  ADMIN (operations manager)                  │
│  ├── Manage products, transactions           │
│  ├── Manage users (not other admins)         │
│  ├── Manage CMS content                      │
│  ├── View analytics dashboard                │
│  └── Configurable permission set             │
│                                              │
│  SUPPORT (customer support)                  │
│  ├── View transactions (read-only)           │
│  ├── Manage support tickets                  │
│  ├── View user profiles                      │
│  └── Cannot modify products/settings         │
│                                              │
│  USER (customer)                             │
│  ├── Create transactions                     │
│  ├── Manage own profile                      │
│  ├── View own transactions                   │
│  ├── Manage wallet                           │
│  └── Create support tickets                  │
└─────────────────────────────────────────────┘
```

### 2.2 Permission Matrix

```
Module: products
├── products.create    - Create new products
├── products.read      - View products (admin panel)
├── products.update    - Edit products
├── products.delete    - Delete products
├── products.sync      - Trigger provider sync
└── products.bulk      - Bulk operations

Module: transactions
├── transactions.read      - View all transactions
├── transactions.update    - Manual status changes
├── transactions.retry     - Retry failed orders
├── transactions.refund    - Process refunds
└── transactions.export    - Export data

Module: users
├── users.read        - View user list/details
├── users.update      - Edit user profiles
├── users.ban         - Ban/suspend users
├── users.roles       - Change user roles
└── users.wallet      - Adjust wallet balance

Module: providers
├── providers.read    - View provider configs
├── providers.manage  - Add/edit/disable providers
├── providers.sync    - Trigger manual sync
└── providers.keys    - View/edit API keys

Module: payments
├── payments.read     - View payment gateway configs
├── payments.manage   - Configure gateways
└── payments.keys     - View/edit API keys

Module: withdrawals
├── withdrawals.read    - View withdrawal requests
├── withdrawals.approve - Approve/reject withdrawals
└── withdrawals.export  - Export withdrawal data

Module: cms
├── cms.banners       - Manage banners
├── cms.articles      - Manage articles
├── cms.announcements - Manage announcements
└── cms.events        - Manage seasonal events

Module: vouchers
├── vouchers.read     - View vouchers
├── vouchers.manage   - Create/edit/delete vouchers
└── vouchers.flash    - Manage flash sales

Module: support
├── support.read      - View tickets
├── support.reply     - Reply to tickets
├── support.assign    - Assign tickets
└── support.close     - Close/reopen tickets

Module: settings
├── settings.read     - View settings
├── settings.manage   - Edit settings
├── settings.maintenance - Toggle maintenance
└── settings.roles    - Manage roles/permissions

Module: audit
├── audit.read        - View audit logs
└── audit.export      - Export audit logs

Module: analytics
├── analytics.dashboard - View dashboard
├── analytics.revenue   - View revenue data
└── analytics.export    - Export analytics
```

### 2.3 RBAC Middleware Implementation

```typescript
// middleware/rbac.middleware.ts

function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user; // Set by auth middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Super admin bypasses all permission checks
    if (user.role === 'super_admin') {
      return next();
    }

    // Check if user has ANY of the required permissions
    const hasPermission = permissions.some(perm => 
      user.permissions.includes(perm)
    );

    if (!hasPermission) {
      // Log unauthorized access attempt
      auditService.log({
        userId: user.id,
        action: 'access_denied',
        module: 'rbac',
        data: { requiredPermissions: permissions, userPermissions: user.permissions },
        ipAddress: req.ip,
      });
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}

// Usage in routes:
router.post('/products', requirePermission('products.create'), productController.create);
router.delete('/products/:id', requirePermission('products.delete'), productController.delete);
router.put('/users/:id/role', requirePermission('users.roles'), userController.changeRole);
```

---

## 3. Security Headers & Protection

### 3.1 HTTP Security Headers

```typescript
// Using Helmet.js + custom headers

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss:", "https://api.midtrans.com", "https://api.xendit.co"],
      frameSrc: ["'self'", "https://app.midtrans.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding payment pages
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Additional custom headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
```

### 3.2 CORS Configuration

```typescript
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,          // https://daymenify.com
    process.env.ADMIN_URL,             // https://admin.daymenify.com (if separate)
  ],
  credentials: true,                    // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // Preflight cache: 24 hours
};
```

### 3.3 Input Validation & Sanitization

```typescript
// All inputs validated with Zod schemas (strict mode)
// HTML sanitization for rich text fields (articles, ticket messages)
// SQL injection prevented by Prisma ORM (parameterized queries)
// NoSQL injection N/A (PostgreSQL only)

// XSS prevention:
// 1. React auto-escapes JSX output
// 2. DOMPurify for user-generated HTML (articles)
// 3. CSP headers prevent inline script execution
// 4. httpOnly cookies prevent XSS token theft

// Additional sanitization:
import sanitizeHtml from 'sanitize-html';

function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'img', 'br'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['https'],
  });
}
```

---

## 4. Rate Limiting Architecture

### 4.1 Multi-Layer Rate Limiting

```
Layer 1: Cloudflare (DDoS protection, bot detection)
  └── 1000 req/min per IP (configurable)

Layer 2: Nginx (connection limiting)
  └── limit_conn_zone / limit_req_zone

Layer 3: Application (Redis-based, granular)
  └── Per endpoint, per user, per IP
```

### 4.2 Application Rate Limiter

```typescript
// middleware/rateLimiter.middleware.ts
// Using Redis sliding window algorithm

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyGenerator: (req: Request) => string; // How to identify the requester
  skipSuccessful?: boolean; // Only count failed requests
  message?: string;
}

// Rate limit configurations per endpoint group
const rateLimits = {
  // Auth endpoints (strict)
  'auth:login': { windowMs: 900000, maxRequests: 5, key: 'ip' },
  'auth:register': { windowMs: 3600000, maxRequests: 3, key: 'ip' },
  'auth:forgot': { windowMs: 3600000, maxRequests: 3, key: 'ip+email' },
  'auth:verify': { windowMs: 300000, maxRequests: 5, key: 'ip' },
  
  // Transaction endpoints (moderate)
  'transaction:create': { windowMs: 60000, maxRequests: 10, key: 'userId' },
  'transaction:check': { windowMs: 60000, maxRequests: 30, key: 'ip' },
  
  // Public API (generous)
  'public:general': { windowMs: 60000, maxRequests: 100, key: 'ip' },
  'public:search': { windowMs: 60000, maxRequests: 30, key: 'ip' },
  
  // User API (moderate)
  'user:general': { windowMs: 60000, maxRequests: 60, key: 'userId' },
  'user:spin': { windowMs: 60000, maxRequests: 5, key: 'userId' },
  'user:withdrawal': { windowMs: 3600000, maxRequests: 3, key: 'userId' },
  
  // Webhook endpoints (high)
  'webhook:payment': { windowMs: 60000, maxRequests: 500, key: 'ip' },
  
  // File uploads (strict)
  'upload:file': { windowMs: 300000, maxRequests: 10, key: 'userId' },
};

// Redis sliding window implementation
async function checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Remove old entries outside window
  await redis.zremrangebyscore(redisKey, 0, windowStart);
  
  // Count current entries
  const count = await redis.zcard(redisKey);
  
  if (count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: windowStart + config.windowMs };
  }
  
  // Add current request
  await redis.zadd(redisKey, now, `${now}:${Math.random()}`);
  await redis.expire(redisKey, Math.ceil(config.windowMs / 1000));
  
  return { allowed: true, remaining: config.maxRequests - count - 1 };
}
```

---

## 5. Fraud Prevention System

### 5.1 Fraud Detection Rules

```typescript
// Fraud detection runs on every transaction creation

interface FraudCheckResult {
  score: number;         // 0-100 (higher = more suspicious)
  flags: FraudFlag[];
  action: 'allow' | 'review' | 'block';
}

const fraudRules = [
  // Rule 1: Velocity check (too many transactions)
  {
    name: 'high_velocity',
    check: async (userId: string) => {
      const last1h = await getTransactionCount(userId, '1h');
      if (last1h > 20) return { score: 40, flag: 'HIGH_VELOCITY' };
      if (last1h > 10) return { score: 20, flag: 'MODERATE_VELOCITY' };
      return { score: 0 };
    }
  },
  
  // Rule 2: Amount anomaly (unusual spending)
  {
    name: 'amount_anomaly',
    check: async (userId: string, amount: number) => {
      const avgAmount = await getUserAvgTransaction(userId);
      if (amount > avgAmount * 5) return { score: 30, flag: 'AMOUNT_ANOMALY' };
      return { score: 0 };
    }
  },
  
  // Rule 3: New account large transaction
  {
    name: 'new_account_large_tx',
    check: async (userId: string, amount: number, accountAge: number) => {
      if (accountAge < 24 * 60 * 60 * 1000 && amount > 500000) {
        return { score: 35, flag: 'NEW_ACCOUNT_LARGE_TX' };
      }
      return { score: 0 };
    }
  },
  
  // Rule 4: Multiple failed payments
  {
    name: 'payment_failures',
    check: async (userId: string) => {
      const failedLast1h = await getFailedPayments(userId, '1h');
      if (failedLast1h > 5) return { score: 30, flag: 'MULTIPLE_PAYMENT_FAILURES' };
      return { score: 0 };
    }
  },
  
  // Rule 5: IP-based suspicious activity
  {
    name: 'ip_reputation',
    check: async (ipAddress: string) => {
      const accountsFromIp = await getAccountsFromIP(ipAddress, '24h');
      if (accountsFromIp > 5) return { score: 25, flag: 'MULTI_ACCOUNT_IP' };
      return { score: 0 };
    }
  },
  
  // Rule 6: Rapid voucher usage
  {
    name: 'voucher_abuse',
    check: async (userId: string) => {
      const voucherUses = await getVoucherUsage(userId, '24h');
      if (voucherUses > 10) return { score: 25, flag: 'VOUCHER_ABUSE' };
      return { score: 0 };
    }
  },
  
  // Rule 7: Withdrawal pattern
  {
    name: 'suspicious_withdrawal',
    check: async (userId: string, amount: number) => {
      const deposits = await getTotalDeposits(userId, '7d');
      const withdrawals = await getTotalWithdrawals(userId, '7d');
      // Withdrawing more than deposited (referral abuse?)
      if (withdrawals + amount > deposits * 1.5) {
        return { score: 20, flag: 'WITHDRAWAL_EXCEEDS_DEPOSITS' };
      }
      return { score: 0 };
    }
  },
];

// Score thresholds:
// 0-30: Allow (normal)
// 31-60: Allow but flag for review
// 61-80: Hold for manual review
// 81-100: Auto-block + alert admin
```

### 5.2 Duplicate Transaction Prevention

```typescript
// Prevent same user from creating duplicate orders

async function checkDuplicateTransaction(params: {
  userId: string;
  productId: string;
  customerData: Record<string, string>;
}): Promise<boolean> {
  // Check Redis for recent identical orders (last 5 minutes)
  const key = `tx:dedup:${params.userId}:${params.productId}:${JSON.stringify(params.customerData)}`;
  const exists = await redis.get(key);
  
  if (exists) {
    return true; // Duplicate detected
  }
  
  // Set dedup key with 5 minute TTL
  await redis.set(key, '1', 'EX', 300);
  return false;
}
```

### 5.3 Referral Fraud Detection

```typescript
// Prevent referral abuse (self-referral, fake accounts)

const referralFraudChecks = [
  // Same IP for referrer and referee
  'same_ip_registration',
  // Same device fingerprint
  'same_device',
  // Referee never makes purchase (ghost accounts)
  'inactive_referee',
  // Too many referrals from single source
  'excessive_referrals',
  // Referral commission withdrawal immediately after earning
  'instant_withdrawal',
];

// Auto-suspend referral rewards if:
// - More than 20 referrals in 24 hours
// - Referee accounts show no activity after 7 days
// - Same IP used for > 3 referral registrations
```

---

## 6. Audit Log System

### 6.1 What Gets Logged

| Category | Events |
|----------|--------|
| Authentication | Login, logout, failed login, password change, token refresh |
| User Management | Create, update, ban, role change, wallet adjustment |
| Products | Create, update, delete, price change, status change |
| Transactions | Manual status change, retry, refund, cancel |
| Providers | Config change, API key update, enable/disable |
| Payment Gateways | Config change, API key update, enable/disable |
| Settings | Any system setting change |
| CMS | Banner/article/announcement CRUD |
| Vouchers | Create, edit, delete |
| Withdrawals | Approve, reject |
| Roles | Create, edit, delete, permission changes |
| Security | Rate limit triggered, fraud blocked, IP blocked |

### 6.2 Audit Middleware

```typescript
// middleware/audit.middleware.ts
// Automatically logs admin actions

function auditAction(module: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Capture request body before processing
    const requestData = { ...req.body };
    
    // Store original json method to capture response
    const originalJson = res.json.bind(res);
    
    res.json = (data: any) => {
      // After response is sent, log the audit
      if (res.statusCode < 400) {
        auditService.log({
          userId: req.user?.id,
          action: `${module}.${action}`,
          module,
          entityType: getEntityType(module),
          entityId: req.params.id,
          oldData: req.existingEntity, // Set by service layer
          newData: requestData,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(err => logger.error('Audit log failed', err));
      }
      return originalJson(data);
    };
    
    next();
  };
}

// Usage:
router.put('/products/:id', 
  requirePermission('products.update'),
  auditAction('products', 'update'),
  productController.update
);
```

### 6.3 Audit Log Retention

```
Hot data (last 30 days): PostgreSQL (fast queries, admin UI)
Warm data (30-90 days): PostgreSQL (archived partition)
Cold data (90+ days): Export to S3/R2 as JSON (compliance)
Deletion: After 2 years (configurable per regulation)
```

---

## 7. Data Protection

### 7.1 Encryption Strategy

| Data | At Rest | In Transit |
|------|---------|-----------|
| User passwords | bcrypt (cost 12) | HTTPS/TLS 1.3 |
| API keys (provider/gateway) | AES-256-GCM | HTTPS/TLS 1.3 |
| Refresh tokens | SHA-256 hash in DB | httpOnly cookie + HTTPS |
| Personal data (email, phone) | Plain (GDPR not applicable in ID) | HTTPS/TLS 1.3 |
| Payment data | Not stored (handled by gateway) | HTTPS/TLS 1.3 |
| Webhook secrets | AES-256-GCM | N/A (server-side only) |

### 7.2 Sensitive Data Handling

```typescript
// Never log sensitive data
const sensitizeForLog = (data: any): any => {
  const sensitive = ['password', 'apiKey', 'apiSecret', 'token', 'secretKey', 'pin'];
  const sanitized = { ...data };
  
  for (const key of sensitive) {
    if (sanitized[key]) {
      sanitized[key] = '***REDACTED***';
    }
  }
  return sanitized;
};

// Never return sensitive fields in API responses
const userResponseFields = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
  // password: NEVER
  // refreshTokens: NEVER
};
```

### 7.3 Session Security

```typescript
// Session configuration
const sessionConfig = {
  // Refresh token cookie settings
  cookie: {
    httpOnly: true,        // Not accessible via JavaScript
    secure: true,          // HTTPS only
    sameSite: 'strict',    // CSRF protection
    path: '/api/v1/auth',  // Only sent to auth endpoints
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: '.daymenify.com',
  },
  
  // Concurrent session limit
  maxSessions: 5, // Max 5 active sessions per user
  
  // Session invalidation triggers
  invalidateOn: [
    'password_change',
    'email_change', 
    'role_change',
    'manual_revoke',
    'security_alert',
  ],
};
```

---

## 8. Webhook Security

### 8.1 Signature Verification Per Gateway

| Gateway | Verification Method |
|---------|-------------------|
| Midtrans | SHA-512(order_id + status_code + gross_amount + server_key) |
| Xendit | x-callback-token header matching |
| Tripay | HMAC-SHA256 of payload with private key |
| Duitku | MD5(merchantCode + amount + merchantOrderId + apiKey) |
| Bayar.gg | HMAC-SHA256 with webhook secret |
| Digiflazz | IP whitelist + payload structure |
| Tokovoucher | MD5(member_code + secret + ref_id) |

### 8.2 Webhook Security Checklist

```
✅ Always verify signature before processing
✅ Log ALL incoming webhooks (even invalid ones)
✅ Implement idempotency (prevent duplicate processing)
✅ Respond within 5 seconds (process async via queue)
✅ Use HTTPS-only webhook endpoints
✅ IP whitelist where supported (Digiflazz)
✅ Rate limit webhook endpoints (prevent replay attacks)
✅ Validate payload structure (reject malformed)
✅ Never expose internal errors in webhook response
✅ Monitor for unexpected webhook patterns
```

---

## 9. Infrastructure Security

### 9.1 Network Security

```
Internet → Cloudflare (DDoS, WAF, Bot) → Nginx → Application
                                                       │
                                               Docker Network (internal)
                                                       │
                              ┌─────────┬─────────┬────┴────┐
                              │         │         │         │
                          PostgreSQL   Redis    Workers   Socket.io
                          (no external access)
```

### 9.2 Environment Variable Security

```bash
# Never commit .env files
# Use .env.example as template (no real values)

# Secrets management hierarchy:
# Production: Docker secrets / Vault / Cloud KMS
# Staging: Environment variables in CI/CD
# Development: Local .env files (gitignored)

# Critical secrets:
DATABASE_URL=          # PostgreSQL connection
REDIS_URL=             # Redis connection
JWT_PRIVATE_KEY=       # RSA private key (PEM)
JWT_PUBLIC_KEY=        # RSA public key (PEM)
ENCRYPTION_KEY=        # AES-256 key for API key encryption
# ... gateway/provider keys stored in DB (encrypted)
```

### 9.3 Docker Security

```yaml
# Security best practices in Docker:
services:
  api:
    # Run as non-root user
    user: "node"
    # Read-only filesystem where possible
    read_only: true
    tmpfs:
      - /tmp
    # Drop all capabilities
    cap_drop:
      - ALL
    # No new privileges
    security_opt:
      - no-new-privileges:true
    # Resource limits
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
```

---

*End of Document*
