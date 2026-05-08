# Daymenify — Frontend Architecture

## Document Version
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-05-08 | Architecture Team | Draft |

---

## 1. Frontend Folder Structure

```
client/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (storefront)/             # Public storefront layout group
│   │   │   ├── layout.tsx            # Storefront layout (navbar+footer)
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── products/
│   │   │   │   ├── page.tsx          # Product listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # Product detail + checkout
│   │   │   ├── categories/
│   │   │   │   ├── page.tsx          # All categories
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # Category products
│   │   │   ├── flash-sale/
│   │   │   │   └── page.tsx          # Flash sale page
│   │   │   ├── check/
│   │   │   │   └── [invoice]/
│   │   │   │       └── page.tsx      # Transaction checker
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx          # Blog listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # Article detail
│   │   │   └── help/
│   │   │       └── page.tsx          # Help/FAQ page
│   │   │
│   │   ├── (auth)/                   # Auth layout group
│   │   │   ├── layout.tsx            # Auth pages layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── verify-email/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/              # User dashboard layout group
│   │   │   ├── layout.tsx            # Dashboard layout (sidebar)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Dashboard overview
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx          # Transaction history
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Transaction detail
│   │   │   ├── wallet/
│   │   │   │   └── page.tsx          # Wallet & deposit
│   │   │   ├── withdrawals/
│   │   │   │   └── page.tsx          # Withdrawal management
│   │   │   ├── referral/
│   │   │   │   └── page.tsx          # Referral dashboard
│   │   │   ├── vouchers/
│   │   │   │   └── page.tsx          # Voucher inventory
│   │   │   ├── spin/
│   │   │   │   └── page.tsx          # Spin wheel
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx          # Notification center
│   │   │   ├── favorites/
│   │   │   │   └── page.tsx          # Favorite products
│   │   │   ├── tickets/
│   │   │   │   ├── page.tsx          # Ticket list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create ticket
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Ticket detail
│   │   │   └── settings/
│   │   │       └── page.tsx          # Profile settings
│   │   │
│   │   ├── (admin)/                  # Admin layout group
│   │   │   ├── layout.tsx            # Admin layout (sidebar+header)
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx          # Admin dashboard
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── categories/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── transactions/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── providers/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── gateways/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── markup/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── withdrawals/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── vouchers/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── flash-sales/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── spin/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── banners/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── articles/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── announcements/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── tickets/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── events/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── referrals/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── roles/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── audit-logs/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── notifications/
│   │   │   │       └── page.tsx
│   │   │   └── ...
│   │   │
│   │   ├── api/                      # Next.js API routes (BFF proxy)
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts      # Google OAuth handler
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── not-found.tsx             # 404 page
│   │   ├── error.tsx                 # Error boundary
│   │   ├── loading.tsx               # Global loading
│   │   └── globals.css               # Global styles
│   │
│   ├── components/
│   │   ├── ui/                       # Base UI components (design system)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Drawer.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── AnnouncementBar.tsx
│   │   │
│   │   ├── storefront/              # Storefront-specific components
│   │   │   ├── HeroBanner.tsx
│   │   │   ├── CategoryGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── FlashSaleSection.tsx
│   │   │   ├── LiveOrderFeed.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── TransactionChecker.tsx
│   │   │   ├── RecommendedProducts.tsx
│   │   │   ├── PopularGames.tsx
│   │   │   └── TrustBadges.tsx
│   │   │
│   │   ├── checkout/                 # Checkout flow components
│   │   │   ├── ProductForm.tsx
│   │   │   ├── PaymentMethodList.tsx
│   │   │   ├── PaymentSummary.tsx
│   │   │   ├── VoucherInput.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   └── OrderStatus.tsx
│   │   │
│   │   ├── dashboard/               # User dashboard components
│   │   │   ├── StatsCard.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   ├── WalletCard.tsx
│   │   │   ├── ReferralCard.tsx
│   │   │   └── NotificationList.tsx
│   │   │
│   │   ├── admin/                    # Admin panel components
│   │   │   ├── StatsWidget.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── TransactionChart.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── FormBuilder.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ProviderHealth.tsx
│   │   │   └── RealtimeWidget.tsx
│   │   │
│   │   ├── gamification/            # Gamification components
│   │   │   ├── SpinWheel.tsx
│   │   │   ├── SpinResult.tsx
│   │   │   └── RewardPopup.tsx
│   │   │
│   │   └── shared/                  # Shared across all areas
│   │       ├── SEOHead.tsx
│   │       ├── LoadingScreen.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ProtectedRoute.tsx
│   │       ├── RoleGuard.tsx
│   │       ├── InfiniteScroll.tsx
│   │       ├── ImageUpload.tsx
│   │       ├── RichTextEditor.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── useNotifications.ts
│   │   ├── usePagination.ts
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useIntersection.ts
│   │   ├── useCountdown.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── stores/                      # Zustand stores
│   │   ├── authStore.ts
│   │   ├── notificationStore.ts
│   │   ├── cartStore.ts
│   │   ├── uiStore.ts
│   │   └── adminStore.ts
│   │
│   ├── lib/                         # Utilities & configuration
│   │   ├── api.ts                   # Axios instance & interceptors
│   │   ├── socket.ts               # Socket.io client setup
│   │   ├── constants.ts            # App constants
│   │   ├── helpers.ts              # Utility functions
│   │   ├── formatters.ts           # Date, currency formatters
│   │   ├── validators.ts           # Client-side validation
│   │   └── seo.ts                  # SEO utilities
│   │
│   ├── types/                       # TypeScript types
│   │   ├── api.types.ts            # API response types
│   │   ├── product.types.ts
│   │   ├── transaction.types.ts
│   │   ├── user.types.ts
│   │   ├── admin.types.ts
│   │   └── common.types.ts
│   │
│   └── styles/                      # Additional styles
│       ├── animations.css
│       └── components.css
│
├── public/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   ├── placeholder.webp
│   │   └── og-default.jpg
│   ├── icons/
│   │   ├── payment/               # Payment method icons
│   │   └── categories/            # Category icons
│   ├── fonts/
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── postcss.config.js
```



---

## 2. Design System & UI Architecture

### 2.1 Design Tokens

```typescript
// tailwind.config.ts - Custom theme
const theme = {
  colors: {
    primary: {
      50: '#eff6ff',    // Lightest blue
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',   // Primary brand blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',   // Accent purple
      600: '#9333ea',
      700: '#7e22ce',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    surface: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      muted: '#94a3b8',
    }
  },
  borderRadius: {
    card: '12px',
    button: '8px',
    input: '8px',
    badge: '6px',
    full: '9999px',
  },
  boxShadow: {
    card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    cardHover: '0 4px 12px rgba(0,0,0,0.1)',
    dropdown: '0 10px 40px rgba(0,0,0,0.12)',
    modal: '0 20px 60px rgba(0,0,0,0.15)',
  },
  fontSize: {
    display: ['2.5rem', { lineHeight: '1.1', fontWeight: '700' }],
    h1: ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
    h2: ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
    h3: ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
    body: ['0.938rem', { lineHeight: '1.6' }],
    small: ['0.813rem', { lineHeight: '1.5' }],
    caption: ['0.75rem', { lineHeight: '1.4' }],
  }
};
```

### 2.2 Component Design Principles

| Principle | Implementation |
|-----------|---------------|
| Mobile-first | All components designed for 360px+ first |
| Lightweight | No heavy UI libraries, custom TailwindCSS components |
| Accessible | ARIA labels, keyboard navigation, focus management |
| Consistent | Shared design tokens, component variants |
| Performant | Lazy loading, virtualization for lists |
| Responsive | Breakpoints: sm(640), md(768), lg(1024), xl(1280) |

### 2.3 Typography

```
Font Family: Inter (primary), system-ui (fallback)
Font Loading: next/font (optimized, no layout shift)

Hierarchy:
- Display: 40px/Bold — Hero sections
- H1: 32px/Bold — Page titles
- H2: 24px/Semibold — Section titles
- H3: 20px/Semibold — Card titles
- Body: 15px/Regular — Content text
- Small: 13px/Regular — Secondary text
- Caption: 12px/Regular — Labels, metadata
```

---

## 3. State Management Architecture

### 3.1 Zustand Store Design

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
}

// stores/notificationStore.ts
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notif: Notification) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  fetchNotifications: () => Promise<void>;
}

// stores/uiStore.ts
interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  
  // Actions
  openModal: (id: string) => void;
  closeModal: () => void;
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
}
```

### 3.2 State Management Rules

| Data Type | Where to Store | Why |
|-----------|---------------|-----|
| Auth/session | Zustand + httpOnly cookie | Persistent, secure |
| Server data (products, transactions) | React Query / SWR | Server state, cache invalidation |
| UI state (modals, menus) | Zustand | Client-only, reactive |
| Form data | React Hook Form | Scoped to form lifecycle |
| URL state (filters, pagination) | URL searchParams | Shareable, bookmarkable |
| Realtime data (notifications) | Zustand + Socket | Live updates |

### 3.3 Data Fetching Strategy

```typescript
// Using custom hooks with Axios
// Pattern: useQuery-like custom hooks

// hooks/useProducts.ts
function useProducts(params: ProductParams) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // ... fetch logic with caching
}

// Alternative: React Query / TanStack Query
// Recommended for production for auto-caching, deduplication, background refetch
```

---

## 4. Page Architecture & Rendering Strategy

### 4.1 Rendering Strategy per Page

| Page | Rendering | Reason |
|------|-----------|--------|
| Homepage | SSG + ISR (60s) | SEO + performance, content updates periodically |
| Product listing | SSG + ISR (30s) | SEO, products change with sync |
| Product detail | SSG + ISR (30s) | SEO critical, pricing updates |
| Blog articles | SSG + ISR (3600s) | Rarely changes, SEO critical |
| Categories | SSG + ISR (300s) | Rarely changes |
| Flash sale | SSR | Dynamic countdown, stock |
| Transaction checker | CSR | User-specific, no SEO value |
| User dashboard | CSR | Auth required, dynamic data |
| Admin panel | CSR | Auth required, realtime data |
| Auth pages | SSG | Static forms |
| Help/FAQ | SSG | Static content |

### 4.2 ISR (Incremental Static Regeneration) Strategy

```typescript
// Product page example
export async function generateStaticParams() {
  const products = await fetchPopularProducts(100);
  return products.map(p => ({ slug: p.slug }));
}

export const revalidate = 30; // Revalidate every 30 seconds

// On-demand revalidation (when admin updates product)
// POST /api/revalidate?path=/products/mobile-legends&secret=xxx
```

---

## 5. Homepage Architecture

### 5.1 Section Breakdown

```
┌─────────────────────────────────────────────┐
│  AnnouncementBar (dismissible)              │
├─────────────────────────────────────────────┤
│  Navbar (sticky)                            │
│  ┌─────────────────────────────────────┐    │
│  │ Logo | Search | Wallet | Notif | User│    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│  HeroBanner (carousel, auto-play)           │
│  [slide 1] [slide 2] [slide 3] [dots]      │
├─────────────────────────────────────────────┤
│  PopularGames (horizontal scroll)           │
│  [ML] [FF] [Genshin] [PUBG] [Valorant]     │
├─────────────────────────────────────────────┤
│  CategoryGrid (icon grid)                   │
│  [Game] [Pulsa] [Data] [PLN] [E-Wallet]    │
├─────────────────────────────────────────────┤
│  FlashSaleSection (countdown + products)    │
│  ⏱ 02:45:30 | [prod1] [prod2] [prod3]      │
├─────────────────────────────────────────────┤
│  RecommendedProducts (grid)                 │
│  [card] [card] [card] [card]                │
├─────────────────────────────────────────────┤
│  LiveOrderFeed (realtime scroll)            │
│  "Rizky baru saja topup 344 DM ML..."      │
├─────────────────────────────────────────────┤
│  TransactionChecker (inline form)           │
│  [Invoice ID input] [Check button]          │
├─────────────────────────────────────────────┤
│  BlogSection (latest 3 articles)            │
│  [article1] [article2] [article3]           │
├─────────────────────────────────────────────┤
│  TrustBadges                                │
│  [24/7] [Instant] [Safe] [Trusted]          │
├─────────────────────────────────────────────┤
│  Footer                                     │
│  [About] [Help] [TOS] [Social] [Contact]    │
└─────────────────────────────────────────────┘
```

### 5.2 Mobile Layout Adaptations

- Navbar collapses to hamburger menu
- Banner becomes full-width swipeable
- Category grid becomes 2-column
- Product cards stack vertically (2 per row)
- Live feed becomes compact single-line
- Footer stacks into accordion sections

---

## 6. Animation & Interaction Design

### 6.1 Framer Motion Usage

```typescript
// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// Card hover
const cardVariants = {
  rest: { scale: 1, shadow: 'card' },
  hover: { scale: 1.02, shadow: 'cardHover', transition: { duration: 0.2 } },
};

// Stagger children (product grid)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};
```

### 6.2 Animation Guidelines

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transition | Fade + slide up | 300ms | ease-out |
| Card hover | Scale + shadow | 200ms | ease |
| Modal open | Fade + scale | 250ms | spring |
| Toast notification | Slide in from right | 300ms | ease-out |
| Dropdown | Fade + slide down | 200ms | ease |
| Skeleton pulse | Opacity pulse | 1500ms | linear loop |
| Button press | Scale down | 100ms | ease |
| Live feed item | Slide in from top | 400ms | ease-out |

### 6.3 Performance Rules

- Use `will-change` sparingly
- Prefer `transform` and `opacity` animations (GPU-accelerated)
- No animation on initial page load (reduce LCP)
- Respect `prefers-reduced-motion` media query
- Lazy-load Framer Motion (dynamic import for non-critical animations)

---

## 7. Real-Time Architecture (Frontend)

### 7.1 Socket.io Client Setup

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }

  // Namespaces
  joinUserRoom(userId: string) { ... }
  joinAdminRoom() { ... }
  joinPublicFeed() { ... }
  
  disconnect() { ... }
}
```

### 7.2 Realtime Events (Client Listens)

| Event | Target | UI Update |
|-------|--------|-----------|
| `transaction:status` | User | Update transaction status badge |
| `notification:new` | User | Toast + increment badge |
| `feed:new-order` | Public | Add item to live feed |
| `admin:new-transaction` | Admin | Dashboard counter + sound |
| `admin:alert` | Admin | Alert notification |
| `flash-sale:update` | Public | Update stock/countdown |
| `maintenance:toggle` | All | Show/hide maintenance overlay |

---

## 8. SEO Architecture (Frontend)

### 8.1 Metadata Strategy

```typescript
// app/(storefront)/products/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  return {
    title: `${product.name} - Top Up Murah | Daymenify`,
    description: `Top up ${product.name} murah dan cepat. Proses instan, harga terjangkau.`,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image, width: 1200, height: 630 }],
      type: 'product',
    },
    alternates: { canonical: `https://daymenify.com/products/${params.slug}` },
  };
}
```

### 8.2 Structured Data (JSON-LD)

```typescript
// Product pages → Product schema
// Blog pages → Article schema
// Homepage → Organization + WebSite schema
// FAQ page → FAQPage schema
// Category pages → ItemList schema
```

### 8.3 SEO Checklist

- [x] Dynamic title tags per page
- [x] Meta descriptions
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Canonical URLs
- [x] Structured data (JSON-LD)
- [x] Sitemap.xml (auto-generated)
- [x] Robots.txt
- [x] Breadcrumb navigation
- [x] Internal linking
- [x] Image alt tags
- [x] Semantic HTML (h1-h6 hierarchy)
- [x] Core Web Vitals optimization

---

## 9. Performance Optimization

### 9.1 Bundle Optimization

| Strategy | Implementation |
|----------|---------------|
| Code splitting | Next.js automatic per-route splitting |
| Dynamic imports | Heavy components (SpinWheel, RichTextEditor, Charts) |
| Tree shaking | Named imports only, no barrel file re-exports |
| Font optimization | next/font with subset (latin) |
| Image optimization | next/image with WebP, blur placeholder |

### 9.2 Loading Strategy

```
Critical path (blocking):
  → Layout CSS (inline critical)
  → Navbar + Hero (immediate render)

Above the fold (priority):
  → Banner images (priority loading)
  → Category icons (preloaded)
  → Popular games (first 6)

Below the fold (lazy):
  → Flash sale section
  → Recommended products
  → Live feed
  → Blog section
  → Footer

Deferred:
  → Analytics scripts
  → Chat widget
  → Push notification worker
```

### 9.3 Image Strategy

| Context | Format | Size | Loading |
|---------|--------|------|---------|
| Banner | WebP | 1200x400 / 600x200 (mobile) | Priority |
| Product thumbnail | WebP | 200x200 | Lazy |
| Product detail | WebP | 600x600 | Priority |
| Category icon | SVG | 48x48 | Eager |
| Avatar | WebP | 80x80 | Lazy |
| Blog thumbnail | WebP | 400x250 | Lazy |
| Payment icons | SVG | 32x24 | Eager |

---

## 10. Admin Dashboard Architecture

### 10.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  Admin Header                                        │
│  [Breadcrumb] [Search] [Notif🔔] [Admin ▾]         │
├────────────┬────────────────────────────────────────┤
│  Sidebar   │  Main Content                          │
│            │                                         │
│  Dashboard │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  Users     │  │Revenue│ │Orders│ │Users │ │Active│ │
│  Products  │  │ 45.2M │ │ 1.2K │ │ 890  │ │  45  │ │
│  Categories│  └──────┘ └──────┘ └──────┘ └──────┘ │
│  Transact. │                                         │
│  Providers │  ┌──────────────────────────────────┐  │
│  Gateways  │  │  Revenue Chart (7d/30d/90d)      │  │
│  Markup    │  │  [line chart]                     │  │
│  ─────────  │  └──────────────────────────────────┘  │
│  Withdraw  │                                         │
│  Vouchers  │  ┌───────────────┐ ┌────────────────┐  │
│  Flash Sale│  │ Recent Orders │ │ Provider Health│  │
│  Spin      │  │ [table]       │ │ [status list]  │  │
│  ─────────  │  └───────────────┘ └────────────────┘  │
│  Banners   │                                         │
│  Articles  │                                         │
│  Announce  │                                         │
│  Tickets   │                                         │
│  ─────────  │                                         │
│  Events    │                                         │
│  Referrals │                                         │
│  Roles     │                                         │
│  Audit     │                                         │
│  Settings  │                                         │
└────────────┴────────────────────────────────────────┘
```

### 10.2 Admin Features

- Collapsible sidebar with grouped menu items
- Realtime stats (auto-refresh via Socket.io)
- Data tables with sort, filter, search, export
- Inline editing for quick updates
- Bulk actions (select multiple, apply action)
- Chart components (recharts/chart.js)
- Activity timeline widget
- Quick action shortcuts

---

## 11. Error & Loading States

### 11.1 Loading States

| Component | Loading UI |
|-----------|------------|
| Page | Full-page skeleton layout |
| Product card | Card-shaped skeleton |
| Data table | Row skeleton (5 rows) |
| Chart | Pulse placeholder |
| Image | Blur-up placeholder |
| Button action | Spinner + disabled |
| Infinite scroll | Bottom spinner |

### 11.2 Error States

| Error Type | UI Response |
|------------|-------------|
| Network error | Toast + retry button |
| 404 page | Custom illustration + go home |
| 500 server | Error page + contact support |
| Auth expired | Auto-refresh or redirect to login |
| Form validation | Inline field errors (red) |
| Payment failed | Status card + retry option |
| Maintenance | Full-page overlay with countdown |

---

*End of Document*
