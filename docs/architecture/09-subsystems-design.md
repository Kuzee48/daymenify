# Daymenify — Subsystems Design

## Document Version
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-05-08 | Architecture Team | Draft |

---

## 1. Wallet System Design

### 1.1 Wallet Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    WALLET SYSTEM                          │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              User Wallet                          │    │
│  │                                                   │    │
│  │  Main Balance ──── For purchases & withdrawals    │    │
│  │  Cashback Balance ── Auto-credited from orders    │    │
│  │  Referral Balance ── From referral commissions    │    │
│  │  Locked Balance ──── Pending transactions         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Operations:                                             │
│  ├── Deposit (via payment gateway)                       │
│  ├── Purchase (deduct for order payment)                 │
│  ├── Cashback Credit (after order complete)              │
│  ├── Referral Credit (when referee purchases)            │
│  ├── Spin Reward Credit (from spin wheel)                │
│  ├── Withdrawal (to bank/e-wallet)                       │
│  ├── Admin Adjustment (manual +/-)                       │
│  └── Refund (failed order return)                        │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Atomic Balance Operations

```typescript
// CRITICAL: All balance operations must be atomic
// Use Prisma transactions + Redis locking

async function deductBalance(userId: string, amount: number, type: string): Promise<void> {
  // Acquire distributed lock
  const lock = await redlock.acquire(`wallet:lock:${userId}`, 5000);
  
  try {
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balance: true },
      });
      
      if (!wallet || Number(wallet.balance) < amount) {
        throw new InsufficientBalanceError();
      }
      
      // Deduct balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
      
      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount: -amount,
          balanceBefore: wallet.balance,
          balanceAfter: Number(wallet.balance) - amount,
          description: `${type} deduction`,
        },
      });
    });
  } finally {
    await lock.release();
  }
}
```

### 1.3 Deposit Flow

```
User selects deposit amount → Selects payment method
→ Payment created via gateway → User pays
→ Webhook confirms payment → Credit wallet balance
→ Record wallet transaction → Notify user
```

### 1.4 Balance Usage Priority

```
When user pays with wallet:
1. Check main balance first
2. If insufficient, check if cashback can supplement
3. Partial wallet + partial gateway payment (hybrid)

When user withdraws:
- Can only withdraw from: main balance + referral balance
- Cashback is spend-only (cannot withdraw)
```

---

## 2. Referral System Design

### 2.1 Referral Flow

```
┌──────────────────────────────────────────────────────────┐
│                   REFERRAL SYSTEM                          │
│                                                           │
│  1. User A registers → Gets unique referral code (AAY123)│
│  2. User A shares: daymenify.com/register?ref=AAY123      │
│  3. User B registers with ref code                        │
│     └── referral record created (A→B)                     │
│  4. User B makes a purchase                               │
│     └── System calculates commission for User A           │
│     └── Commission = (transaction amount × commission%)   │
│  5. Commission credited to User A's referral balance      │
│  6. User A can withdraw commission                        │
│                                                           │
│  Commission Configuration (admin-configurable):           │
│  ├── Percentage: 2-5% of transaction amount               │
│  ├── Max per transaction: Rp 10,000                       │
│  ├── Only on completed transactions                       │
│  ├── Only first 12 months after referral                  │
│  └── Minimum withdrawal: Rp 25,000                        │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Referral Rewards (Beyond Commission)

| Milestone | Reward |
|-----------|--------|
| 5 successful referrals | 1 spin ticket |
| 10 successful referrals | Rp 10,000 voucher |
| 25 successful referrals | Rp 50,000 bonus |
| 50 successful referrals | VIP badge + 5% extra commission |
| Leaderboard top 10 (monthly) | Cash prize pool |

### 2.3 Referral Leaderboard

```typescript
// Leaderboard updated every hour via cron
// Cached in Redis for fast retrieval
// Rankings based on: total commission earned in current month

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string; // Masked: "Ri***ky"
  avatar: string;
  totalReferrals: number;
  totalCommission: number;
  currentMonthCommission: number;
}
```

---

## 3. Spin Wheel / Gacha System

### 3.1 Probability System

```typescript
// Weighted probability distribution

interface SpinRewardConfig {
  id: string;
  name: string;
  type: SpinRewardType;
  value: number;
  probability: number;  // Must sum to 1.0 across all rewards
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  color: string;        // Wheel segment color
  stockLimit: number | null;
  stockUsed: number;
}

// Example configuration:
const defaultRewards = [
  { name: 'Rp 500',      probability: 0.30, rarity: 'COMMON' },
  { name: 'Rp 1,000',    probability: 0.25, rarity: 'COMMON' },
  { name: 'Rp 2,500',    probability: 0.15, rarity: 'UNCOMMON' },
  { name: 'Rp 5,000',    probability: 0.12, rarity: 'UNCOMMON' },
  { name: 'Rp 10,000',   probability: 0.08, rarity: 'RARE' },
  { name: '5% Voucher',  probability: 0.05, rarity: 'RARE' },
  { name: 'Rp 25,000',   probability: 0.03, rarity: 'EPIC' },
  { name: 'Rp 50,000',   probability: 0.015, rarity: 'EPIC' },
  { name: 'Rp 100,000',  probability: 0.004, rarity: 'LEGENDARY' },
  { name: 'Jackpot!',    probability: 0.001, rarity: 'LEGENDARY' },
];
// Total: 1.000
```

### 3.2 Spin Selection Algorithm

```typescript
async function executeSpin(userId: string, costType: SpinCostType): Promise<SpinResult> {
  // 1. Validate user can spin (has tickets/balance, daily limit)
  await validateSpinEligibility(userId, costType);
  
  // 2. Deduct cost (ticket or wallet balance)
  await deductSpinCost(userId, costType);
  
  // 3. Get active rewards with available stock
  const rewards = await getActiveRewards();
  
  // 4. Weighted random selection
  const selected = weightedRandomSelect(rewards);
  
  // 5. Check stock (if limited)
  if (selected.stockLimit !== null && selected.stockUsed >= selected.stockLimit) {
    // Fallback to lowest-tier reward
    selected = rewards.find(r => r.rarity === 'COMMON');
  }
  
  // 6. Deliver reward
  await deliverReward(userId, selected);
  
  // 7. Update stock counter
  await updateRewardStock(selected.id);
  
  // 8. Log spin
  await createSpinLog(userId, selected, costType);
  
  // 9. Return result (frontend shows animation then reveal)
  return {
    rewardId: selected.id,
    rewardName: selected.name,
    rewardValue: selected.value,
    rarity: selected.rarity,
    wheelPosition: calculateWheelPosition(rewards, selected),
  };
}

function weightedRandomSelect(rewards: SpinRewardConfig[]): SpinRewardConfig {
  const random = Math.random();
  let cumulative = 0;
  
  for (const reward of rewards) {
    cumulative += reward.probability;
    if (random <= cumulative) return reward;
  }
  
  return rewards[rewards.length - 1]; // Fallback
}
```

### 3.3 Spin Cost Types

| Type | Source | Admin Configurable |
|------|--------|-------------------|
| TICKET | Earned from referrals, events, purchases | Cost: 1 ticket |
| WALLET | Wallet balance deduction | Cost: Rp 2,000 - 10,000 |
| FREE | Daily free spin (1 per day) | Enabled/disabled |

### 3.4 Anti-Abuse Measures

- Daily spin limit: 20 spins per user
- Minimum interval: 10 seconds between spins
- Server-side randomization only (never client-side)
- All spin results logged with timestamp
- Admin can view spin analytics and detect anomalies

---

## 4. Flash Sale System

### 4.1 Flash Sale Lifecycle

```
Admin creates flash sale
        │
        ▼
[SCHEDULED] ──(start time reached)──▶ [ACTIVE]
                                          │
                                     (end time OR stock depleted)
                                          │
                                          ▼
                                      [ENDED]
```

### 4.2 Stock Management

```typescript
// Flash sale stock is tracked in Redis for performance
// Database is source of truth, Redis is fast access layer

// On flash sale activation:
await redis.set(`flash-sale:stock:${fsProductId}`, stockLimit);

// On purchase:
async function decrementFlashSaleStock(fsProductId: string): Promise<boolean> {
  // Atomic decrement - returns new value
  const remaining = await redis.decr(`flash-sale:stock:${fsProductId}`);
  
  if (remaining < 0) {
    // Stock exhausted, revert
    await redis.incr(`flash-sale:stock:${fsProductId}`);
    return false; // Out of stock
  }
  
  // Also update database (eventual consistency)
  await prisma.flashSaleProduct.update({
    where: { id: fsProductId },
    data: { stockSold: { increment: 1 } },
  });
  
  return true; // Success
}

// Per-user limit enforcement:
const userPurchaseKey = `flash-sale:user:${fsProductId}:${userId}`;
const userCount = await redis.incr(userPurchaseKey);
if (userCount > maxPerUser) {
  // User exceeded limit
  await redis.decr(userPurchaseKey);
  throw new BusinessLogicError('Flash sale purchase limit reached');
}
```

### 4.3 Frontend Countdown

```typescript
// Server sends end time, frontend counts down
// Socket.io emits stock updates in realtime

// Events:
// flash-sale:stock-update → { fsProductId, remaining }
// flash-sale:ended → { flashSaleId }
```

---

## 5. Notification System Design

### 5.1 Multi-Channel Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 NOTIFICATION SYSTEM                       │
│                                                          │
│  Event occurs (transaction completed, etc.)              │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────────────────┐                               │
│  │ Notification Service │                               │
│  │                      │                               │
│  │ 1. Check user prefs  │                               │
│  │ 2. Select channels   │                               │
│  │ 3. Render template   │                               │
│  │ 4. Queue per channel │                               │
│  └──────────┬───────────┘                               │
│             │                                            │
│    ┌────────┼────────┬────────┬────────┐                │
│    │        │        │        │        │                │
│    ▼        ▼        ▼        ▼        ▼                │
│ ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐              │
│ │IN_APP││EMAIL ││TELEGRAM│PUSH  ││DISCORD│             │
│ │      ││      ││      ││      ││      │              │
│ │Save  ││SMTP  ││Bot API││FCM   ││Webhook│             │
│ │+Socket││Send  ││Send  ││Send  ││Send  │              │
│ └──────┘└──────┘└──────┘└──────┘└──────┘              │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Notification Templates

```typescript
// Template system with variable substitution

const templates = {
  'transaction.completed': {
    title: 'Transaksi Berhasil! ✅',
    body: 'Top up {{productName}} ({{denomination}}) untuk {{customerTarget}} berhasil. SN: {{serialNumber}}',
    channels: ['IN_APP', 'EMAIL'],
  },
  'transaction.failed': {
    title: 'Transaksi Gagal ❌',
    body: 'Maaf, transaksi {{invoiceId}} gagal diproses. Dana akan dikembalikan dalam 1x24 jam.',
    channels: ['IN_APP', 'EMAIL', 'PUSH'],
  },
  'payment.received': {
    title: 'Pembayaran Diterima 💰',
    body: 'Pembayaran Rp {{amount}} untuk {{invoiceId}} telah dikonfirmasi. Pesanan sedang diproses.',
    channels: ['IN_APP'],
  },
  'withdrawal.approved': {
    title: 'Penarikan Disetujui ✅',
    body: 'Penarikan Rp {{amount}} ke {{accountName}} sedang diproses. Estimasi 1-3 hari kerja.',
    channels: ['IN_APP', 'EMAIL'],
  },
  'admin.new_transaction': {
    title: 'Transaksi Baru',
    body: '{{userName}} membuat order {{invoiceId}} - {{productName}} (Rp {{amount}})',
    channels: ['TELEGRAM', 'DISCORD'],
  },
  'admin.provider_down': {
    title: '⚠️ Provider Down',
    body: 'Provider {{providerName}} tidak merespon. Circuit breaker OPEN. Last error: {{error}}',
    channels: ['TELEGRAM', 'DISCORD'],
  },
};
```

### 5.3 Telegram Bot Integration

```typescript
// Admin notification via Telegram Bot API
// Bot token stored in settings
// Chat ID configured per admin user

class TelegramNotificationAdapter {
  private botToken: string;
  
  async send(chatId: string, message: string): Promise<void> {
    await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
  }
}
```

---

## 6. Voucher & Cashback System

### 6.1 Voucher Types & Rules

| Type | Behavior | Example |
|------|----------|---------|
| PERCENTAGE | Discount by % of amount | 10% off, max Rp 20,000 |
| FIXED | Fixed amount discount | Rp 5,000 off |
| FREE_SHIPPING | N/A for digital (reserved) | - |

### 6.2 Voucher Validation Rules

```typescript
async function validateVoucher(code: string, userId: string, amount: number, productId: string): Promise<VoucherValidation> {
  const voucher = await voucherRepo.findByCode(code);
  
  // Check existence
  if (!voucher) throw new NotFoundError('Voucher not found');
  
  // Check active status
  if (!voucher.isActive) throw new BusinessLogicError('Voucher inactive');
  
  // Check date range
  const now = new Date();
  if (now < voucher.startDate || now > voucher.endDate) {
    throw new BusinessLogicError('Voucher expired or not yet active');
  }
  
  // Check global usage limit
  if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
    throw new BusinessLogicError('Voucher usage limit reached');
  }
  
  // Check per-user limit
  const userUsage = await voucherUsageRepo.countByUserAndVoucher(userId, voucher.id);
  if (userUsage >= voucher.usagePerUser) {
    throw new BusinessLogicError('You have already used this voucher');
  }
  
  // Check minimum purchase
  if (amount < Number(voucher.minPurchase)) {
    throw new BusinessLogicError(`Minimum purchase: Rp ${voucher.minPurchase}`);
  }
  
  // Check product applicability
  if (voucher.applicableType !== 'ALL') {
    const applicable = voucher.applicableIds.includes(productId);
    if (!applicable) throw new BusinessLogicError('Voucher not applicable to this product');
  }
  
  // Calculate discount
  let discount = 0;
  if (voucher.type === 'PERCENTAGE') {
    discount = amount * Number(voucher.value) / 100;
    if (voucher.maxDiscount) discount = Math.min(discount, Number(voucher.maxDiscount));
  } else {
    discount = Number(voucher.value);
  }
  
  return { valid: true, discount, voucherId: voucher.id };
}
```

### 6.3 Cashback Rules

```typescript
// Cashback credited after transaction is COMPLETED
// Multiple rules can stack (e.g., category + global)

async function calculateCashback(transaction: Transaction): Promise<number> {
  let totalCashback = 0;
  
  // Find applicable rules (active, within date range)
  const rules = await cashbackRuleRepo.findApplicable(
    transaction.productId,
    transaction.product.categoryId
  );
  
  for (const rule of rules) {
    let cashback = 0;
    if (rule.type === 'PERCENTAGE') {
      cashback = Number(transaction.totalAmount) * Number(rule.value) / 100;
      if (rule.maxCashback) cashback = Math.min(cashback, Number(rule.maxCashback));
    } else {
      cashback = Number(rule.value);
    }
    totalCashback += cashback;
  }
  
  return totalCashback;
}
```

---

## 7. CMS & Blog System

### 7.1 Article Management

```typescript
// Rich text editor (TipTap or similar)
// Features: headings, bold, italic, links, images, lists, code blocks

interface Article {
  id: string;
  title: string;
  slug: string;         // Auto-generated from title
  excerpt: string;      // First 150 chars or manual
  content: string;      // Sanitized HTML
  thumbnail: string;    // Uploaded image URL
  category: string;     // SEO category
  tags: string[];
  authorId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: Date | null;
  metaTitle: string;
  metaDescription: string;
  viewCount: number;
}

// SEO features per article:
// - Auto-generate Open Graph image
// - JSON-LD Article structured data
// - Canonical URL
// - Reading time estimation
// - Related articles suggestion
```

### 7.2 Banner Management

```
Admin creates banner:
├── Upload desktop image (1200x400)
├── Upload mobile image (600x200) [optional]
├── Set click destination URL
├── Set position (homepage, category, product)
├── Set sort order (drag & drop)
├── Set active dates (start/end)
└── Toggle active/inactive
```

### 7.3 Announcement System

```typescript
// Announcement types and display:
// TOP_BAR: Sticky bar at top of page (dismissible)
// POPUP: Modal popup on homepage (once per session)
// HOMEPAGE: Section on homepage
// DASHBOARD: User dashboard notice

// Priority levels determine display order
// Only highest-priority active announcement shown for TOP_BAR
// Multiple can show for POPUP (sequential)
```

---

## 8. Seasonal Event System

### 8.1 Event Configuration

```typescript
interface SeasonalEvent {
  id: string;
  name: string;           // "Ramadan Sale 2026"
  slug: string;
  description: string;
  banner: string;         // Event banner image
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  
  // Theme customization
  themeConfig: {
    primaryColor: string;     // Override primary color
    accentColor: string;
    headerDecoration: string; // CSS class or image URL
    snowEffect: boolean;      // Particle effects
    confettiOnPurchase: boolean;
    customLogo: string | null;
    backgroundImage: string | null;
  };
  
  // Associated promotions
  voucherIds: string[];       // Event-specific vouchers
  flashSaleId: string | null; // Event flash sale
  spinRewardIds: string[];    // Event-only spin rewards
}
```

### 8.2 Event Examples

| Event | Period | Theme | Rewards |
|-------|--------|-------|---------|
| Ramadan Sale | 1 month | Green/gold, crescent moon | Special vouchers, bonus cashback |
| 11.11 Sale | 1 day | Red/gold, fireworks | Flash sale, jackpot spin |
| Independence Day | 1 week | Red/white, flag | Patriotic vouchers, quiz |
| New Year | 3 days | Confetti, countdown | Mega spin, bonus referral |
| Anniversary | 1 week | Brand colors, cake | Free spin, big discounts |

### 8.3 Dynamic Theme Application

```typescript
// Frontend checks active events on page load
// If event active: apply theme overrides via CSS variables
// Decorations rendered as overlay components

// API: GET /api/v1/settings/public returns activeEvent data
// Frontend conditionally renders:
// - Custom header decorations
// - Event countdown banner
// - Particle effects (snow, confetti)
// - Modified color scheme
```

---

## 9. Withdrawal System Design

### 9.1 Withdrawal Flow

```
User requests withdrawal
        │
        ▼
┌─────────────────────────────┐
│ Validate:                    │
│ ├── Min amount (Rp 25,000)  │
│ ├── Sufficient balance       │
│ ├── No pending withdrawal    │
│ ├── Account verified         │
│ └── Fraud check              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Lock balance (deduct)        │
│ Create withdrawal record     │
│ Status: PENDING              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Admin reviews (if > Rp 500K)│
│ OR auto-approve (if ≤ 500K) │
└──────────────┬──────────────┘
               │
          ┌────┴────┐
          │         │
      (approve)  (reject)
          │         │
          ▼         ▼
┌──────────────┐ ┌──────────────┐
│Process via   │ │Return balance│
│bank transfer │ │Notify user   │
│or e-wallet   │ │              │
└──────────────┘ └──────────────┘
```

### 9.2 Withdrawal Configuration

| Setting | Value | Admin Configurable |
|---------|-------|-------------------|
| Minimum amount | Rp 25,000 | Yes |
| Maximum per day | Rp 5,000,000 | Yes |
| Fee (percentage) | 2.5% | Yes |
| Fee (minimum) | Rp 2,500 | Yes |
| Auto-approve threshold | Rp 500,000 | Yes |
| Processing time | 1-3 business days | Display only |
| Daily withdrawal limit | 3 per user | Yes |

---

## 10. Product Recommendation Engine

### 10.1 Recommendation Strategies

```typescript
// Simple but effective recommendation system (no ML needed initially)

const recommendationStrategies = {
  // 1. Most popular (globally)
  trending: async () => {
    // Products with highest transaction count in last 7 days
    return prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { totalSold: 'desc' },
      take: 12,
    });
  },
  
  // 2. Personalized (user history)
  forYou: async (userId: string) => {
    // Products from categories the user has purchased before
    const userCategories = await getUserFrequentCategories(userId);
    return prisma.product.findMany({
      where: { categoryId: { in: userCategories }, status: 'ACTIVE' },
      orderBy: { totalSold: 'desc' },
      take: 12,
    });
  },
  
  // 3. Recently viewed (Redis-tracked)
  recentlyViewed: async (userId: string) => {
    const productIds = await redis.lrange(`user:viewed:${userId}`, 0, 11);
    return prisma.product.findMany({ where: { id: { in: productIds } } });
  },
  
  // 4. Frequently bought together
  boughtTogether: async (productId: string) => {
    // Users who bought X also bought Y
    // Simple co-occurrence from transaction data
  },
  
  // 5. Same category popular
  categoryPopular: async (categoryId: string, excludeId: string) => {
    return prisma.product.findMany({
      where: { categoryId, status: 'ACTIVE', id: { not: excludeId } },
      orderBy: { totalSold: 'desc' },
      take: 6,
    });
  },
};
```

### 10.2 View Tracking

```typescript
// Track product views in Redis (lightweight, no DB write)
async function trackProductView(userId: string | null, productId: string): void {
  if (userId) {
    // Per-user recently viewed (max 50 items)
    await redis.lpush(`user:viewed:${userId}`, productId);
    await redis.ltrim(`user:viewed:${userId}`, 0, 49);
  }
  
  // Global view counter (for trending)
  await redis.zincrby('products:views:7d', 1, productId);
}
```

---

## 11. Support Ticket System

### 11.1 Ticket Lifecycle

```
User creates ticket (category + subject + message + attachments)
        │
        ▼
[OPEN] → Admin sees in queue → Admin assigns to self
        │
        ▼
[IN_PROGRESS] → Admin replies → User notified
        │
        ▼
[WAITING_USER] → User replies → Back to IN_PROGRESS
        │
        ▼
[RESOLVED] → User confirms or auto-close after 48h
        │
        ▼
[CLOSED] → Can be reopened by user within 7 days
```

### 11.2 Ticket Features

- File upload (images, screenshots) - max 5 files, 5MB each
- Ticket categories: Transaction, Payment, Account, Technical, Refund, Other
- Priority auto-assignment based on category and keywords
- SLA tracking (response time, resolution time)
- Canned responses for admin (templates)
- Auto-close after 48h of user inactivity in WAITING_USER state

---

## 12. Maintenance Mode System

### 12.1 Maintenance Types

| Type | Scope | Effect |
|------|-------|--------|
| Global | Entire platform | All users see maintenance page |
| Product | Specific product | Product shows "maintenance" badge |
| Category | Entire category | Category products disabled |
| Provider | All products from provider | Auto-detected, products disabled |
| Gateway | Payment gateway | Gateway methods hidden |
| Scheduled | Future maintenance | Countdown + announcement |

### 12.2 Auto-Detection

```typescript
// Provider maintenance auto-detection:
// If provider health check fails 5 times consecutively
// → Auto-disable provider
// → Mark products as MAINTENANCE
// → Alert admin
// → Auto-enable when health recovers

// Gateway maintenance auto-detection:
// If webhook errors > threshold in window
// → Alert admin
// → Suggest disabling gateway
// → Show alternative payment methods to users
```

---

*End of Document*
