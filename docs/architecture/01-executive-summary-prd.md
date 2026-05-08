# Daymenify — Executive Summary & Product Requirements Document

## Document Version
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-05-08 | Architecture Team | Draft |

---

## 1. Executive Summary

### 1.1 Vision Statement
Daymenify is a production-grade Indonesian digital marketplace and top-up platform designed to serve millions of Indonesian users with instant digital product fulfillment. The platform aggregates multiple providers (Digiflazz, VIP-Reseller, Tokovoucher) and payment gateways (Midtrans, Xendit, Tripay, etc.) into a unified, automated, and scalable system.

### 1.2 Business Model
- **B2C Marketplace**: End-users purchase digital products (game top-up, pulsa, data packages, PLN tokens, e-wallet, vouchers)
- **Revenue Streams**:
  - Product markup (percentage + fixed per product/category/provider)
  - Payment gateway fee pass-through
  - Flash sale margin optimization
  - Withdrawal fees
  - Premium membership (future)
- **Cost Structure**:
  - Provider product costs (wholesale pricing)
  - Payment gateway fees (2-4%)
  - Infrastructure costs (hosting, CDN, Redis, PostgreSQL)
  - Operational costs (support, marketing)

### 1.3 Target Market
- **Primary**: Indonesian gamers (13-35 years old)
- **Secondary**: General consumers needing pulsa, data, PLN tokens
- **Tertiary**: Small resellers looking for competitive pricing
- **Market Size**: 190M+ internet users in Indonesia, $2.5B+ digital goods market

### 1.4 Key Differentiators
- Fully automated order processing (zero manual intervention)
- Multi-provider smart routing with automatic fallback
- Sub-3-second transaction completion for most products
- Competitive pricing through dynamic markup optimization
- Gamification (spin wheel, referral rewards, cashback)
- Enterprise-grade reliability with queue-based architecture

---

## 2. Product Requirements

### 2.1 Core Product Categories

| Category | Examples | Priority |
|----------|----------|----------|
| Game Top-up | Mobile Legends, Free Fire, Genshin Impact, PUBG Mobile | P0 |
| Pulsa | Telkomsel, XL, Indosat, Tri, Smartfren | P0 |
| Data Package | All operators, daily/weekly/monthly packages | P0 |
| PLN Token | Prepaid electricity tokens (20K-1M) | P0 |
| E-Wallet | GoPay, OVO, DANA, ShopeePay, LinkAja | P1 |
| Voucher | Google Play, Steam, PlayStation, Netflix | P1 |
| Digital Products | Streaming subs, software licenses | P2 |

### 2.2 User Personas

#### Persona 1: Casual Gamer (Primary)
- **Name**: Rizky, 19 years old, college student
- **Behavior**: Top-up 1-3x per week, price-sensitive, mobile-first
- **Needs**: Fast checkout, competitive pricing, promo/cashback
- **Pain Points**: Slow processing, confusing UI, hidden fees

#### Persona 2: Regular Consumer
- **Name**: Ibu Sari, 35 years old, housewife
- **Behavior**: Monthly pulsa/data/PLN purchase, uses mobile exclusively
- **Needs**: Simple UI, trusted platform, WhatsApp notification
- **Pain Points**: Complex flows, unfamiliar payment methods

#### Persona 3: Micro-Reseller
- **Name**: Andi, 25 years old, small kiosk owner
- **Behavior**: 20-50 transactions/day, bulk purchases
- **Needs**: API access (future), competitive wholesale, fast processing
- **Pain Points**: Stock issues, provider downtime, slow support

### 2.3 Functional Requirements

#### FR-001: User Management
- Registration with email/phone
- Login with credentials or Google OAuth
- Profile management
- Email/phone verification
- Password reset flow
- Session management with refresh token rotation

#### FR-002: Product Catalog
- Hierarchical category system (Category > Sub-category > Product > SKU)
- Product search with autocomplete
- Product filtering and sorting
- Dynamic pricing display
- Stock/availability indicators
- Product form validation (e.g., game ID validation)

#### FR-003: Transaction Processing
- Cart-less instant checkout (single product per transaction)
- Payment method selection
- Payment amount calculation (product + markup + fee - discount)
- Order creation and tracking
- Automatic payment verification via webhook
- Automatic provider order dispatch
- Transaction status updates (realtime)
- Invoice generation

#### FR-004: Payment System
- Multiple payment gateway support
- Dynamic payment method availability
- Payment expiry with countdown
- Failed payment retry
- Refund processing (manual/auto)
- Payment proof upload (for manual methods)

#### FR-005: User Wallet System
- Deposit via payment gateway
- Balance usage for purchases
- Cashback credit
- Referral commission credit
- Withdrawal to bank/e-wallet
- Transaction history
- Balance locking for pending transactions

#### FR-006: Referral & Gamification
- Unique referral code/link generation
- Referral commission on referee's transactions
- Referral leaderboard
- Spin wheel with weighted probability
- Voucher inventory per user
- Cashback system per product/category

#### FR-007: Admin Management
- Full CRUD for all entities
- Real-time dashboard with analytics
- Provider management (add/configure/monitor)
- Payment gateway management
- User management with role assignment
- Transaction management (manual override)
- Content management (banners, articles, announcements)
- System configuration
- Audit log viewer

#### FR-008: Notification System
- In-app notifications (realtime via WebSocket)
- Email notifications (transactional)
- Telegram bot notifications (admin alerts)
- Discord webhook (admin alerts)
- Browser push notifications
- WhatsApp-ready architecture

#### FR-009: Support System
- Ticket creation with category selection
- File/image upload for proof
- Admin reply system
- Ticket status management
- WhatsApp floating button
- FAQ/Help center

#### FR-010: CMS & SEO
- Article/blog management
- Banner management (homepage carousel)
- Announcement management
- Dynamic SEO metadata per page
- Sitemap generation
- Structured data (JSON-LD)

### 2.4 Non-Functional Requirements

| Requirement | Target | Priority |
|-------------|--------|----------|
| Page Load Time | < 2 seconds (LCP) | P0 |
| Transaction Processing | < 5 seconds (payment to completion) | P0 |
| System Uptime | 99.9% availability | P0 |
| Concurrent Users | 10,000+ simultaneous | P1 |
| Daily Transactions | 100,000+ | P1 |
| Database Response | < 50ms average query | P0 |
| API Response Time | < 200ms (p95) | P0 |
| Mobile Score | > 90 Lighthouse | P1 |
| Security | OWASP Top 10 compliant | P0 |
| Data Retention | 2 years transaction data | P1 |

### 2.5 Success Metrics (KPIs)

| Metric | Target (Month 3) | Target (Month 12) |
|--------|-------------------|---------------------|
| Monthly Active Users | 10,000 | 100,000 |
| Daily Transactions | 1,000 | 10,000 |
| Transaction Success Rate | > 95% | > 98% |
| Average Order Value | Rp 30,000 | Rp 35,000 |
| User Retention (30-day) | 40% | 55% |
| NPS Score | > 30 | > 50 |
| Support Resolution Time | < 4 hours | < 2 hours |
| System Uptime | 99.5% | 99.9% |

---

## 3. Business Flow

### 3.1 Core Transaction Flow
```
User browses product → Selects product/denomination → Enters game ID/phone
→ Selects payment method → Creates order → Pays → Payment confirmed (webhook)
→ Order queued → Provider API called → Product delivered → User notified
```

### 3.2 Revenue Flow
```
User pays (Product Price + Markup + Gateway Fee - Discount)
→ Gateway settles to company bank
→ Company pays provider (wholesale cost)
→ Net Revenue = Markup + Fee Revenue - Discounts - Operational Cost
```

### 3.3 Referral Flow
```
User A shares referral link → User B registers via link
→ User B makes purchase → System calculates commission
→ Commission credited to User A's wallet → User A can withdraw
```

### 3.4 Withdrawal Flow
```
User requests withdrawal → System validates (min amount, balance, fraud check)
→ Admin reviews (if above threshold) / Auto-approve (if below)
→ Funds transferred → User notified → Audit logged
```

---

## 4. Feature Breakdown by Module

### Module 1: Storefront (Public)
- Homepage with all sections
- Product catalog pages
- Product detail & checkout
- Transaction checker (no login required)
- Blog/Articles
- Help center

### Module 2: User Account
- Authentication (register/login/reset)
- Dashboard overview
- Transaction history
- Wallet management
- Referral management
- Notification center
- Voucher inventory
- Profile settings
- Support tickets

### Module 3: Admin Panel
- Analytics dashboard
- User management
- Product management
- Category management
- Transaction management
- Provider management
- Payment gateway management
- Banner/CMS management
- Announcement management
- Voucher management
- Flash sale management
- Referral management
- Spin wheel management
- Support/Ticket management
- System settings
- Audit logs
- Withdrawal management
- Seasonal event management

### Module 4: System Services
- Queue workers (BullMQ)
- WebSocket server (Socket.io)
- Cron jobs (sync, cleanup, maintenance check)
- Webhook handlers
- Notification dispatcher
- Provider health monitor

---

## 5. Competitive Analysis

| Feature | Codashop | UniPin | Tokopedia | Daymenify |
|---------|----------|--------|-----------|-----------|
| Game Top-up | ✅ | ✅ | ✅ | ✅ |
| Pulsa/Data | ❌ | ❌ | ✅ | ✅ |
| PLN Token | ❌ | ❌ | ✅ | ✅ |
| E-Wallet | ❌ | ❌ | ✅ | ✅ |
| No Login Purchase | ✅ | ✅ | ❌ | ✅ (checker) |
| Referral System | ❌ | ❌ | ✅ | ✅ |
| Cashback | ❌ | ✅ | ✅ | ✅ |
| Gamification | ❌ | ❌ | ❌ | ✅ |
| Flash Sale | ❌ | ❌ | ✅ | ✅ |
| Realtime Feed | ❌ | ❌ | ❌ | ✅ |
| Multi-Provider | Single | Single | Multi | Multi |
| Auto Fallback | ❌ | ❌ | ✅ | ✅ |

---

## 6. Risk Analysis

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Provider downtime | High | Medium | Multi-provider fallback, health monitoring |
| Payment gateway issues | High | Low | Multi-gateway support, manual QRIS backup |
| Fraud/abuse | High | Medium | Rate limiting, fraud detection, withdrawal review |
| Traffic spike | Medium | Medium | Queue architecture, horizontal scaling |
| Data breach | Critical | Low | Encryption, RBAC, audit logs, security headers |
| Regulatory changes | Medium | Low | Modular architecture, compliance layer |
| Provider price changes | Medium | High | Auto-sync, markup recalculation, alerts |

---

## 7. Development Phases

### Phase 1: Foundation (Weeks 1-4)
- Core infrastructure setup
- Authentication system
- Product catalog (manual CRUD)
- Basic storefront
- Admin panel skeleton
- Database schema

### Phase 2: Transactions (Weeks 5-8)
- Payment gateway integration (Midtrans + 1 other)
- Provider integration (Digiflazz)
- Auto-complete order flow
- Queue system
- Basic webhook handling
- Transaction tracking

### Phase 3: Growth Features (Weeks 9-12)
- Wallet system
- Referral system
- Voucher/Cashback system
- Flash sale system
- Notification system
- Additional providers/gateways

### Phase 4: Polish & Scale (Weeks 13-16)
- Spin wheel / gamification
- Seasonal events
- Blog CMS
- SEO optimization
- Performance optimization
- Monitoring & alerting
- Security hardening
- Load testing

### Phase 5: Production Launch (Weeks 17-18)
- Staging environment testing
- Security audit
- Performance benchmarks
- Soft launch (limited users)
- Full production launch
- Monitoring & hotfix support

---

*End of Document*
