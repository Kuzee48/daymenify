# Daymenify — Database Design & Prisma Schema

## Document Version
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-05-08 | Architecture Team | Draft |

---

## 1. Entity Relationship Overview

### 1.1 Core Domain Groups

```
┌─────────────────────────────────────────────────────────────────┐
│                        IDENTITY & ACCESS                         │
│  users ─── roles ─── permissions ─── role_permissions           │
│  user_sessions ─── refresh_tokens                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CATALOG & PRODUCTS                          │
│  categories ─── products ─── product_prices                     │
│  providers ─── provider_products ─── markup_rules               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   TRANSACTIONS & PAYMENTS                        │
│  transactions ─── transaction_logs ─── payment_records          │
│  payment_gateways ─── payment_methods                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     WALLET & FINANCE                             │
│  wallets ─── wallet_transactions ─── withdrawals                │
│  referrals ─── referral_logs ─── referral_commissions           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   PROMOTIONS & GAMIFICATION                      │
│  vouchers ─── voucher_usages ─── flash_sales                    │
│  flash_sale_products ─── spin_rewards ─── spin_logs             │
│  cashback_rules                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       CMS & CONTENT                              │
│  banners ─── articles ─── announcements                         │
│  seasonal_events ─── faqs                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SUPPORT & COMMUNICATION                       │
│  tickets ─── ticket_messages ─── notifications                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     SYSTEM & MONITORING                          │
│  audit_logs ─── webhook_logs ─── system_settings                │
│  provider_health_logs ─── cron_logs                              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Relationships

```
users (1) ──── (N) transactions
users (1) ──── (1) wallets
users (1) ──── (N) referrals (as referrer)
users (1) ──── (N) notifications
users (1) ──── (N) tickets
users (1) ──── (N) voucher_usages
users (1) ──── (1) roles

categories (1) ──── (N) products
products (1) ──── (N) transactions
products (N) ──── (N) providers (via provider_products)
products (N) ──── (N) flash_sales (via flash_sale_products)

transactions (1) ──── (N) transaction_logs
transactions (1) ──── (1) payment_records
transactions (1) ──── (0..1) voucher_usages

providers (1) ──── (N) provider_products
payment_gateways (1) ──── (N) payment_methods
```

---

## 2. Prisma Schema Design

### 2.1 Identity & Access Models

```prisma
// ============================================
// IDENTITY & ACCESS CONTROL
// ============================================

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  phone           String?   @unique
  password        String    // bcrypt hashed
  name            String
  username        String?   @unique
  avatar          String?
  emailVerified   Boolean   @default(false)
  phoneVerified   Boolean   @default(false)
  googleId        String?   @unique
  referralCode    String    @unique // Auto-generated unique code
  referredBy      String?   // Referral code used during registration
  status          UserStatus @default(ACTIVE)
  lastLoginAt     DateTime?
  lastLoginIp     String?
  
  roleId          String
  role            Role      @relation(fields: [roleId], references: [id])
  
  // Relations
  wallet          Wallet?
  transactions    Transaction[]
  notifications   Notification[]
  tickets         Ticket[]
  voucherUsages   VoucherUsage[]
  spinLogs        SpinLog[]
  favorites       UserFavorite[]
  referralsMade   Referral[]  @relation("ReferrerRelation")
  referredUsers   Referral[]  @relation("RefereeRelation")
  withdrawals     Withdrawal[]
  refreshTokens   RefreshToken[]
  auditLogs       AuditLog[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([email])
  @@index([phone])
  @@index([referralCode])
  @@index([status])
  @@index([roleId])
  @@map("users")
}

model Role {
  id          String    @id @default(uuid())
  name        String    @unique // admin, user, super_admin, support
  displayName String
  description String?
  isSystem    Boolean   @default(false) // Cannot be deleted
  
  users       User[]
  permissions RolePermission[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("roles")
}

model Permission {
  id          String    @id @default(uuid())
  name        String    @unique // e.g., "products.create", "transactions.view"
  module      String    // products, transactions, users, etc.
  action      String    // create, read, update, delete, manage
  description String?
  
  roles       RolePermission[]

  @@index([module])
  @@map("permissions")
}

model RolePermission {
  id           String    @id @default(uuid())
  roleId       String
  permissionId String
  
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model RefreshToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String
  userAgent String?
  ipAddress String?
  expiresAt DateTime
  revokedAt DateTime?
  replacedBy String?  // Token rotation tracking
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
  SUSPENDED
}
```

### 2.2 Catalog & Product Models

```prisma
// ============================================
// CATALOG & PRODUCTS
// ============================================

model Category {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  icon        String?   // Icon URL or icon name
  image       String?
  parentId    String?   // For sub-categories
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  metadata    Json?     // Flexible metadata
  
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([slug])
  @@index([parentId])
  @@index([isActive, sortOrder])
  @@map("categories")
}

model Product {
  id              String    @id @default(uuid())
  name            String
  slug            String    @unique
  description     String?
  shortDesc       String?   // Short description for cards
  image           String?
  categoryId      String
  type            ProductType
  status          ProductStatus @default(ACTIVE)
  
  // Pricing
  basePrice       Decimal   @db.Decimal(15, 2)
  sellingPrice    Decimal   @db.Decimal(15, 2) // After markup
  strikePrice     Decimal?  @db.Decimal(15, 2) // Original price (for discount display)
  
  // Product specifics
  denomination    String?   // e.g., "86 Diamonds", "5GB 30 Hari"
  formFields      Json?     // Dynamic form fields (userId, serverId, phone, etc.)
  
  // SEO
  metaTitle       String?
  metaDescription String?
  
  // Flags
  isFeatured      Boolean   @default(false)
  isPopular       Boolean   @default(false)
  sortOrder       Int       @default(0)
  
  // Stats
  totalSold       Int       @default(0)
  
  category        Category  @relation(fields: [categoryId], references: [id])
  providerProducts ProviderProduct[]
  transactions    Transaction[]
  flashSaleItems  FlashSaleProduct[]
  favorites       UserFavorite[]
  cashbackRules   CashbackRule[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([slug])
  @@index([categoryId])
  @@index([status])
  @@index([type])
  @@index([isPopular])
  @@index([isFeatured])
  @@index([sellingPrice])
  @@map("products")
}

model ProviderProduct {
  id              String    @id @default(uuid())
  productId       String
  providerId      String
  providerCode    String    // SKU code at provider
  providerPrice   Decimal   @db.Decimal(15, 2) // Cost from provider
  isActive        Boolean   @default(true)
  priority        Int       @default(0) // Higher = preferred
  lastSyncAt      DateTime?
  metadata        Json?     // Provider-specific data
  
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  provider        Provider  @relation(fields: [providerId], references: [id])

  @@unique([productId, providerId, providerCode])
  @@index([providerId])
  @@index([providerCode])
  @@index([isActive, priority])
  @@map("provider_products")
}

model Provider {
  id              String    @id @default(uuid())
  name            String
  code            String    @unique // digiflazz, vipreseller, tokovoucher
  type            ProviderType
  apiUrl          String
  apiKey          String    // Encrypted
  apiSecret       String?   // Encrypted
  webhookSecret   String?   // Encrypted
  isActive        Boolean   @default(true)
  priority        Int       @default(0)
  balance         Decimal?  @db.Decimal(15, 2)
  balanceUpdatedAt DateTime?
  settings        Json?     // Provider-specific settings
  
  providerProducts ProviderProduct[]
  transactions    Transaction[]
  healthLogs      ProviderHealthLog[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([code])
  @@index([isActive, priority])
  @@map("providers")
}

model MarkupRule {
  id          String    @id @default(uuid())
  name        String
  type        MarkupType // PERCENTAGE, FIXED, BOTH
  percentage  Decimal?  @db.Decimal(5, 2)
  fixedAmount Decimal?  @db.Decimal(15, 2)
  scope       MarkupScope // GLOBAL, CATEGORY, PRODUCT, PROVIDER
  scopeId     String?   // categoryId, productId, or providerId
  priority    Int       @default(0) // Higher priority overrides
  isActive    Boolean   @default(true)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([scope, scopeId])
  @@index([isActive, priority])
  @@map("markup_rules")
}

model UserFavorite {
  id        String    @id @default(uuid())
  userId    String
  productId String
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt DateTime  @default(now())

  @@unique([userId, productId])
  @@map("user_favorites")
}

enum ProductType {
  GAME_TOPUP
  PULSA
  DATA_PACKAGE
  PLN_TOKEN
  EWALLET
  VOUCHER
  STREAMING
  OTHER
}

enum ProductStatus {
  ACTIVE
  INACTIVE
  OUT_OF_STOCK
  MAINTENANCE
}

enum ProviderType {
  DIGIFLAZZ
  VIP_RESELLER
  TOKOVOUCHER
  CUSTOM
}

enum MarkupType {
  PERCENTAGE
  FIXED
  BOTH
}

enum MarkupScope {
  GLOBAL
  CATEGORY
  PRODUCT
  PROVIDER
}
```

### 2.3 Transaction & Payment Models

```prisma
// ============================================
// TRANSACTIONS & PAYMENTS
// ============================================

model Transaction {
  id              String    @id @default(uuid())
  invoiceId       String    @unique // INV-20260508-XXXX format
  userId          String?   // Nullable for guest checkout (future)
  productId       String
  providerId      String?   // Assigned after payment
  
  // Order details
  productName     String    // Snapshot at time of order
  denomination    String?
  customerData    Json      // Game ID, phone, etc.
  
  // Pricing snapshot
  basePrice       Decimal   @db.Decimal(15, 2)
  markupAmount    Decimal   @db.Decimal(15, 2)
  discountAmount  Decimal   @default(0) @db.Decimal(15, 2)
  feeAmount       Decimal   @default(0) @db.Decimal(15, 2)
  totalAmount     Decimal   @db.Decimal(15, 2) // Final amount user pays
  
  // Status
  status          TransactionStatus @default(PENDING)
  paymentStatus   PaymentStatus @default(UNPAID)
  
  // Provider response
  providerRef     String?   // Provider's reference ID
  providerStatus  String?
  serialNumber    String?   // SN/token from provider
  
  // Payment
  paymentMethod   String?
  paymentGateway  String?
  paidAt          DateTime?
  paidAmount      Decimal?  @db.Decimal(15, 2)
  
  // Voucher
  voucherId       String?
  
  // Metadata
  ipAddress       String?
  userAgent       String?
  notes           String?
  metadata        Json?
  
  // Expiry
  expiresAt       DateTime? // Payment expiry
  completedAt     DateTime?
  
  user            User?     @relation(fields: [userId], references: [id])
  product         Product   @relation(fields: [productId], references: [id])
  provider        Provider? @relation(fields: [providerId], references: [id])
  logs            TransactionLog[]
  paymentRecord   PaymentRecord?
  voucherUsage    VoucherUsage?
  referralLog     ReferralLog?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([invoiceId])
  @@index([userId])
  @@index([status])
  @@index([paymentStatus])
  @@index([createdAt])
  @@index([userId, status])
  @@index([paymentGateway, paymentStatus])
  @@map("transactions")
}

model TransactionLog {
  id            String    @id @default(uuid())
  transactionId String
  action        String    // created, payment_received, processing, sent_to_provider, completed, failed
  status        String
  message       String?
  data          Json?     // Additional context
  source        String?   // system, webhook, admin, cron
  
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  createdAt     DateTime  @default(now())

  @@index([transactionId])
  @@index([createdAt])
  @@map("transaction_logs")
}

model PaymentRecord {
  id              String    @id @default(uuid())
  transactionId   String    @unique
  gatewayName     String    // midtrans, xendit, tripay, etc.
  gatewayRef      String?   // Gateway's transaction ID
  method          String    // VA_BCA, QRIS, EWALLET_GOPAY, etc.
  amount          Decimal   @db.Decimal(15, 2)
  fee             Decimal   @default(0) @db.Decimal(15, 2) // Gateway fee
  status          PaymentStatus @default(UNPAID)
  payUrl          String?   // Payment URL / QR
  vaNumber        String?   // Virtual account number
  expiresAt       DateTime?
  paidAt          DateTime?
  callbackData    Json?     // Raw webhook payload
  
  transaction     Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([gatewayRef])
  @@index([gatewayName, status])
  @@map("payment_records")
}

model PaymentGateway {
  id          String    @id @default(uuid())
  name        String    // Display name
  code        String    @unique // midtrans, xendit, tripay, etc.
  apiUrl      String
  apiKey      String    // Encrypted
  apiSecret   String?   // Encrypted
  merchantId  String?
  webhookSecret String? // Encrypted
  isActive    Boolean   @default(true)
  isSandbox   Boolean   @default(false)
  priority    Int       @default(0)
  feeType     FeeType   @default(PERCENTAGE)
  feeValue    Decimal   @default(0) @db.Decimal(5, 2)
  settings    Json?     // Gateway-specific config
  
  methods     PaymentMethod[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([code])
  @@index([isActive])
  @@map("payment_gateways")
}

model PaymentMethod {
  id          String    @id @default(uuid())
  gatewayId   String
  name        String    // "BCA Virtual Account"
  code        String    // VA_BCA, QRIS, EWALLET_GOPAY
  type        PaymentMethodType // VA, EWALLET, QRIS, RETAIL, BANK_TRANSFER
  icon        String?
  isActive    Boolean   @default(true)
  minAmount   Decimal   @default(0) @db.Decimal(15, 2)
  maxAmount   Decimal?  @db.Decimal(15, 2)
  feeType     FeeType   @default(FIXED)
  feeValue    Decimal   @default(0) @db.Decimal(15, 2)
  sortOrder   Int       @default(0)
  
  gateway     PaymentGateway @relation(fields: [gatewayId], references: [id], onDelete: Cascade)

  @@unique([gatewayId, code])
  @@index([isActive, sortOrder])
  @@map("payment_methods")
}

enum TransactionStatus {
  PENDING       // Waiting for payment
  PAID          // Payment received, queued
  PROCESSING    // Sent to provider
  COMPLETED     // Provider confirmed success
  FAILED        // Provider failed
  REFUNDED      // Refund processed
  EXPIRED       // Payment expired
  CANCELLED     // User/admin cancelled
}

enum PaymentStatus {
  UNPAID
  PAID
  EXPIRED
  REFUNDED
  FAILED
}

enum PaymentMethodType {
  VIRTUAL_ACCOUNT
  EWALLET
  QRIS
  RETAIL
  BANK_TRANSFER
  CREDIT_CARD
  MANUAL
}

enum FeeType {
  PERCENTAGE
  FIXED
  BOTH
}
```



### 2.4 Wallet & Finance Models

```prisma
// ============================================
// WALLET & FINANCE
// ============================================

model Wallet {
  id              String    @id @default(uuid())
  userId          String    @unique
  balance         Decimal   @default(0) @db.Decimal(15, 2)
  lockedBalance   Decimal   @default(0) @db.Decimal(15, 2) // Pending transactions
  cashbackBalance Decimal   @default(0) @db.Decimal(15, 2)
  referralBalance Decimal   @default(0) @db.Decimal(15, 2)
  totalDeposit    Decimal   @default(0) @db.Decimal(15, 2)
  totalSpent      Decimal   @default(0) @db.Decimal(15, 2)
  totalWithdrawn  Decimal   @default(0) @db.Decimal(15, 2)
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions    WalletTransaction[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@map("wallets")
}

model WalletTransaction {
  id          String    @id @default(uuid())
  walletId    String
  type        WalletTxType
  amount      Decimal   @db.Decimal(15, 2)
  balanceBefore Decimal @db.Decimal(15, 2)
  balanceAfter  Decimal @db.Decimal(15, 2)
  description String
  referenceId String?   // Transaction/withdrawal/referral ID
  referenceType String? // transaction, withdrawal, referral, deposit, spin
  metadata    Json?
  
  wallet      Wallet    @relation(fields: [walletId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now())

  @@index([walletId])
  @@index([type])
  @@index([createdAt])
  @@index([referenceId])
  @@map("wallet_transactions")
}

model Withdrawal {
  id          String    @id @default(uuid())
  userId      String
  amount      Decimal   @db.Decimal(15, 2)
  fee         Decimal   @default(0) @db.Decimal(15, 2)
  netAmount   Decimal   @db.Decimal(15, 2) // amount - fee
  method      WithdrawalMethod
  accountName String
  accountNumber String
  bankName    String?
  status      WithdrawalStatus @default(PENDING)
  notes       String?
  adminNotes  String?
  processedBy String?   // Admin user ID
  processedAt DateTime?
  
  user        User      @relation(fields: [userId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("withdrawals")
}

model Referral {
  id          String    @id @default(uuid())
  referrerId  String    // User who shared the link
  refereeId   String    // User who registered
  status      ReferralStatus @default(ACTIVE)
  
  referrer    User      @relation("ReferrerRelation", fields: [referrerId], references: [id])
  referee     User      @relation("RefereeRelation", fields: [refereeId], references: [id])
  logs        ReferralLog[]

  createdAt   DateTime  @default(now())

  @@unique([referrerId, refereeId])
  @@index([referrerId])
  @@index([refereeId])
  @@map("referrals")
}

model ReferralLog {
  id            String    @id @default(uuid())
  referralId    String
  transactionId String?   @unique
  commission    Decimal   @db.Decimal(15, 2)
  percentage    Decimal   @db.Decimal(5, 2) // Commission percentage applied
  status        ReferralLogStatus @default(PENDING)
  paidAt        DateTime?
  
  referral      Referral  @relation(fields: [referralId], references: [id], onDelete: Cascade)

  createdAt     DateTime  @default(now())

  @@index([referralId])
  @@index([status])
  @@map("referral_logs")
}

enum WalletTxType {
  DEPOSIT
  PURCHASE
  REFUND
  CASHBACK
  REFERRAL_COMMISSION
  WITHDRAWAL
  SPIN_REWARD
  ADMIN_ADJUSTMENT
}

enum WithdrawalMethod {
  BANK_TRANSFER
  EWALLET
  QRIS
}

enum WithdrawalStatus {
  PENDING
  APPROVED
  PROCESSING
  COMPLETED
  REJECTED
  CANCELLED
}

enum ReferralStatus {
  ACTIVE
  INACTIVE
}

enum ReferralLogStatus {
  PENDING
  PAID
  CANCELLED
}
```

### 2.5 Promotions & Gamification Models

```prisma
// ============================================
// PROMOTIONS & GAMIFICATION
// ============================================

model Voucher {
  id              String    @id @default(uuid())
  code            String    @unique
  name            String
  description     String?
  type            VoucherType // PERCENTAGE, FIXED
  value           Decimal   @db.Decimal(15, 2)
  maxDiscount     Decimal?  @db.Decimal(15, 2) // Cap for percentage type
  minPurchase     Decimal   @default(0) @db.Decimal(15, 2)
  usageLimit      Int?      // Total usage limit
  usagePerUser    Int       @default(1) // Per user limit
  usageCount      Int       @default(0)
  applicableType  VoucherApplicable @default(ALL) // ALL, CATEGORY, PRODUCT
  applicableIds   String[]  // Category or product IDs
  startDate       DateTime
  endDate         DateTime
  isActive        Boolean   @default(true)
  isPublic        Boolean   @default(true) // Show in storefront
  
  usages          VoucherUsage[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([code])
  @@index([isActive, startDate, endDate])
  @@map("vouchers")
}

model VoucherUsage {
  id            String    @id @default(uuid())
  voucherId     String
  userId        String
  transactionId String?   @unique
  discountAmount Decimal  @db.Decimal(15, 2)
  
  voucher       Voucher   @relation(fields: [voucherId], references: [id])
  user          User      @relation(fields: [userId], references: [id])
  transaction   Transaction? @relation(fields: [transactionId], references: [id])

  createdAt     DateTime  @default(now())

  @@index([voucherId])
  @@index([userId])
  @@map("voucher_usages")
}

model FlashSale {
  id          String    @id @default(uuid())
  name        String
  description String?
  banner      String?
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean   @default(true)
  
  products    FlashSaleProduct[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isActive, startDate, endDate])
  @@map("flash_sales")
}

model FlashSaleProduct {
  id            String    @id @default(uuid())
  flashSaleId   String
  productId     String
  salePrice     Decimal   @db.Decimal(15, 2)
  stockLimit    Int       // Limited stock
  stockSold     Int       @default(0)
  maxPerUser    Int       @default(1)
  
  flashSale     FlashSale @relation(fields: [flashSaleId], references: [id], onDelete: Cascade)
  product       Product   @relation(fields: [productId], references: [id])

  @@unique([flashSaleId, productId])
  @@map("flash_sale_products")
}

model CashbackRule {
  id          String    @id @default(uuid())
  name        String
  type        CashbackType // PERCENTAGE, FIXED
  value       Decimal   @db.Decimal(15, 2)
  maxCashback Decimal?  @db.Decimal(15, 2)
  minPurchase Decimal   @default(0) @db.Decimal(15, 2)
  scope       CashbackScope // ALL, CATEGORY, PRODUCT
  scopeId     String?
  isActive    Boolean   @default(true)
  startDate   DateTime?
  endDate     DateTime?
  
  product     Product?  @relation(fields: [scopeId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isActive, scope])
  @@map("cashback_rules")
}

model SpinReward {
  id          String    @id @default(uuid())
  name        String
  type        SpinRewardType
  value       Decimal   @db.Decimal(15, 2)
  probability Decimal   @db.Decimal(5, 4) // 0.0000 to 1.0000
  rarity      SpinRarity
  color       String?   // Wheel segment color
  icon        String?
  stockLimit  Int?      // Null = unlimited
  stockUsed   Int       @default(0)
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  
  spinLogs    SpinLog[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("spin_rewards")
}

model SpinLog {
  id          String    @id @default(uuid())
  userId      String
  rewardId    String
  costType    SpinCostType // TICKET, WALLET, FREE
  costAmount  Decimal   @default(0) @db.Decimal(15, 2)
  rewardValue Decimal   @db.Decimal(15, 2)
  delivered   Boolean   @default(false)
  
  user        User      @relation(fields: [userId], references: [id])
  reward      SpinReward @relation(fields: [rewardId], references: [id])

  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([createdAt])
  @@map("spin_logs")
}

enum VoucherType {
  PERCENTAGE
  FIXED
}

enum VoucherApplicable {
  ALL
  CATEGORY
  PRODUCT
}

enum CashbackType {
  PERCENTAGE
  FIXED
}

enum CashbackScope {
  ALL
  CATEGORY
  PRODUCT
}

enum SpinRewardType {
  WALLET_BALANCE
  VOUCHER
  CASHBACK
  FREE_TOPUP
  SPIN_TICKET
  NOTHING
}

enum SpinRarity {
  COMMON      // 60% chance segment
  UNCOMMON    // 25% chance segment
  RARE        // 10% chance segment
  EPIC        // 4% chance segment
  LEGENDARY   // 1% chance segment
}

enum SpinCostType {
  TICKET
  WALLET
  FREE
}
```

### 2.6 CMS & Content Models

```prisma
// ============================================
// CMS & CONTENT
// ============================================

model Banner {
  id          String    @id @default(uuid())
  title       String
  image       String    // Desktop image
  mobileImage String?   // Mobile image
  link        String?   // Click destination
  position    BannerPosition @default(HOMEPAGE)
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  startDate   DateTime?
  endDate     DateTime?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([position, isActive, sortOrder])
  @@map("banners")
}

model Article {
  id              String    @id @default(uuid())
  title           String
  slug            String    @unique
  excerpt         String?
  content         String    // Rich text HTML
  thumbnail       String?
  category        String?
  tags            String[]
  authorId        String
  status          ContentStatus @default(DRAFT)
  publishedAt     DateTime?
  viewCount       Int       @default(0)
  
  // SEO
  metaTitle       String?
  metaDescription String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([slug])
  @@index([status, publishedAt])
  @@index([category])
  @@map("articles")
}

model Announcement {
  id          String    @id @default(uuid())
  title       String
  content     String
  type        AnnouncementType @default(INFO)
  position    AnnouncementPosition @default(TOP_BAR)
  priority    Int       @default(0)
  isActive    Boolean   @default(true)
  isDismissible Boolean @default(true)
  startDate   DateTime?
  endDate     DateTime?
  link        String?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isActive, position, priority])
  @@map("announcements")
}

model SeasonalEvent {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  banner      String?
  themeConfig Json?     // Colors, decorations, etc.
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean   @default(true)
  voucherIds  String[]  // Associated voucher IDs
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isActive, startDate, endDate])
  @@map("seasonal_events")
}

enum BannerPosition {
  HOMEPAGE
  CATEGORY
  PRODUCT
  DASHBOARD
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum AnnouncementType {
  INFO
  WARNING
  PROMO
  MAINTENANCE
  URGENT
}

enum AnnouncementPosition {
  TOP_BAR
  POPUP
  HOMEPAGE
  DASHBOARD
}
```

### 2.7 Support & Communication Models

```prisma
// ============================================
// SUPPORT & COMMUNICATION
// ============================================

model Ticket {
  id          String    @id @default(uuid())
  ticketNumber String   @unique // TKT-20260508-001
  userId      String
  subject     String
  category    TicketCategory
  priority    TicketPriority @default(MEDIUM)
  status      TicketStatus @default(OPEN)
  assignedTo  String?   // Admin user ID
  closedAt    DateTime?
  
  user        User      @relation(fields: [userId], references: [id])
  messages    TicketMessage[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@index([assignedTo])
  @@index([createdAt])
  @@map("tickets")
}

model TicketMessage {
  id          String    @id @default(uuid())
  ticketId    String
  senderId    String    // User or admin ID
  senderType  SenderType
  message     String
  attachments String[]  // File URLs
  
  ticket      Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now())

  @@index([ticketId])
  @@map("ticket_messages")
}

model Notification {
  id          String    @id @default(uuid())
  userId      String
  title       String
  message     String
  type        NotificationType
  channel     NotificationChannel @default(IN_APP)
  isRead      Boolean   @default(false)
  readAt      DateTime?
  data        Json?     // Action data (link, reference)
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt   DateTime  @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@map("notifications")
}

enum TicketCategory {
  TRANSACTION
  PAYMENT
  ACCOUNT
  TECHNICAL
  REFUND
  OTHER
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_USER
  RESOLVED
  CLOSED
}

enum SenderType {
  USER
  ADMIN
  SYSTEM
}

enum NotificationType {
  TRANSACTION
  PAYMENT
  PROMO
  SYSTEM
  REFERRAL
  WITHDRAWAL
  TICKET
}

enum NotificationChannel {
  IN_APP
  EMAIL
  TELEGRAM
  PUSH
  DISCORD
}
```

### 2.8 System & Monitoring Models

```prisma
// ============================================
// SYSTEM & MONITORING
// ============================================

model AuditLog {
  id          String    @id @default(uuid())
  userId      String?
  action      String    // user.login, product.update, settings.change
  module      String    // auth, products, transactions, settings
  entityType  String?   // Product, Transaction, User
  entityId    String?
  oldData     Json?     // Previous state
  newData     Json?     // New state
  ipAddress   String?
  userAgent   String?
  
  user        User?     @relation(fields: [userId], references: [id])

  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([module])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

model WebhookLog {
  id          String    @id @default(uuid())
  source      String    // midtrans, xendit, digiflazz, etc.
  endpoint    String    // /api/webhook/midtrans
  method      String    @default("POST")
  headers     Json?
  payload     Json
  statusCode  Int?      // Our response code
  response    Json?     // Our response body
  processedAt DateTime?
  error       String?
  
  createdAt   DateTime  @default(now())

  @@index([source])
  @@index([createdAt])
  @@map("webhook_logs")
}

model ProviderHealthLog {
  id          String    @id @default(uuid())
  providerId  String
  status      HealthStatus
  responseTime Int?     // milliseconds
  error       String?
  checkedAt   DateTime  @default(now())
  
  provider    Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([providerId, checkedAt])
  @@map("provider_health_logs")
}

model SystemSetting {
  id          String    @id @default(uuid())
  key         String    @unique
  value       Json
  group       String    // general, payment, provider, notification, maintenance
  description String?
  isPublic    Boolean   @default(false) // Exposed to frontend
  
  updatedAt   DateTime  @updatedAt

  @@index([group])
  @@index([key])
  @@map("system_settings")
}

enum HealthStatus {
  HEALTHY
  DEGRADED
  DOWN
}
```

---

## 3. Indexing Strategy

### 3.1 Critical Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| transactions | `(userId, status, createdAt)` | User's filtered transaction list |
| transactions | `(paymentStatus, expiresAt)` | Payment expiry cron job |
| transactions | `(status, createdAt)` | Admin transaction listing |
| products | `(categoryId, status, sortOrder)` | Category product page |
| products | `(status, isPopular)` | Homepage popular section |
| wallet_transactions | `(walletId, createdAt)` | Wallet history pagination |
| notifications | `(userId, isRead, createdAt)` | User notification feed |
| audit_logs | `(createdAt, module)` | Admin audit log viewer |

### 3.2 Full-Text Search Indexes

```sql
-- Product search (PostgreSQL GIN index)
CREATE INDEX idx_products_search ON products 
USING GIN (to_tsvector('indonesian', name || ' ' || COALESCE(description, '')));

-- Article search
CREATE INDEX idx_articles_search ON articles 
USING GIN (to_tsvector('indonesian', title || ' ' || COALESCE(excerpt, '')));
```

---

## 4. Migration Strategy

### 4.1 Migration Rules
- Every schema change requires a migration file
- Migrations must be reversible (up/down)
- No data-destructive migrations in production without backup
- Large table alterations must use concurrent index creation
- Foreign key additions on large tables should be done in phases

### 4.2 Seed Data
- Default roles (super_admin, admin, support, user)
- Default permissions (full CRUD matrix)
- Default system settings
- Default payment methods
- Sample categories

---

*End of Document*
