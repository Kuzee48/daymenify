# Daymenify — Provider & Payment Gateway Architecture

## Document Version
| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2026-05-08 | Architecture Team | Draft |

---

## 1. Provider Integration Architecture

### 1.1 Provider Abstraction Layer

```
┌─────────────────────────────────────────────────────────┐
│                   PROVIDER SERVICE                        │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │             IProviderAdapter Interface            │    │
│  │                                                   │    │
│  │  + getProducts(): Product[]                       │    │
│  │  + createOrder(params): OrderResponse             │    │
│  │  + checkOrderStatus(refId): StatusResponse        │    │
│  │  + checkBalance(): BalanceResponse                │    │
│  │  + verifyCallback(payload, sig): boolean          │    │
│  │  + getProductStatus(code): AvailabilityResponse   │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│           ┌──────────────┼──────────────┐               │
│           │              │              │               │
│           ▼              ▼              ▼               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  Digiflazz   │ │ VIP-Reseller │ │ Tokovoucher  │   │
│  │   Adapter    │ │   Adapter    │ │   Adapter    │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │           Provider Router (Smart Routing)        │    │
│  │                                                   │    │
│  │  Selects best provider based on:                  │    │
│  │  • Priority setting                               │    │
│  │  • Health status (circuit breaker)                │    │
│  │  • Price (cheapest first option)                  │    │
│  │  • Product availability                           │    │
│  │  • Balance sufficiency                            │    │
│  │  • Time of day (some have maintenance windows)    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Provider Interface Definition

```typescript
// services/provider/provider.interface.ts

interface IProviderAdapter {
  readonly name: string;
  readonly code: string; // digiflazz, vipreseller, tokovoucher

  // Product Operations
  fetchProducts(): Promise<ProviderProductRaw[]>;
  getProductStatus(providerCode: string): Promise<ProductAvailability>;
  
  // Order Operations
  createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse>;
  checkOrderStatus(refId: string): Promise<ProviderStatusResponse>;
  
  // Account Operations
  checkBalance(): Promise<ProviderBalance>;
  
  // Webhook
  verifyWebhookSignature(payload: any, signature: string): boolean;
  parseWebhookPayload(payload: any): ProviderWebhookData;
}

interface CreateOrderParams {
  refId: string;          // Our transaction/invoice ID
  productCode: string;    // Provider's product SKU
  customerNumber: string; // Phone/Game ID/PLN meter
  customerData?: Record<string, string>; // Additional fields
}

interface ProviderOrderResponse {
  success: boolean;
  providerRef: string;    // Provider's order reference
  status: 'pending' | 'processing' | 'success' | 'failed';
  serialNumber?: string;  // SN/token (if instant)
  message?: string;
  rawResponse?: any;
}

interface ProviderBalance {
  balance: number;
  currency: string;
  updatedAt: Date;
}
```

### 1.3 Digiflazz Adapter

```typescript
// services/provider/digiflazz.adapter.ts

class DigiflazzAdapter implements IProviderAdapter {
  readonly name = 'Digiflazz';
  readonly code = 'digiflazz';
  
  private apiUrl = 'https://api.digiflazz.com/v1';
  private username: string;
  private apiKey: string;

  // Auth: MD5(username + apiKey + refId) signature
  private generateSign(refId: string): string {
    return md5(this.username + this.apiKey + refId);
  }

  async fetchProducts(): Promise<ProviderProductRaw[]> {
    // POST /price-list
    // Body: { cmd: "pasca/prepaid", username, sign: md5(username+apiKey+"pricelist") }
    // Returns: array of products with buyer_sku_code, price, status
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse> {
    // POST /transaction
    // Body: { username, buyer_sku_code, customer_no, ref_id, sign }
    // Sign: md5(username + apiKey + ref_id)
  }

  async checkBalance(): Promise<ProviderBalance> {
    // POST /cek-saldo
    // Body: { cmd: "deposit", username, sign: md5(username+apiKey+"depo") }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    // Digiflazz uses IP whitelist + payload structure validation
    // Verify: payload contains buyer_sku_code, customer_no, ref_id, status
  }

  parseWebhookPayload(payload: any): ProviderWebhookData {
    return {
      refId: payload.data.ref_id,
      status: this.mapStatus(payload.data.status),
      serialNumber: payload.data.sn,
      message: payload.data.message,
      rawData: payload,
    };
  }

  private mapStatus(status: string): OrderStatus {
    // Digiflazz statuses: Sukses, Pending, Gagal
    const map = { 'Sukses': 'success', 'Pending': 'processing', 'Gagal': 'failed' };
    return map[status] || 'unknown';
  }
}
```

### 1.4 VIP-Reseller Adapter

```typescript
// services/provider/vipreseller.adapter.ts

class VipResellerAdapter implements IProviderAdapter {
  readonly name = 'VIP Reseller';
  readonly code = 'vipreseller';
  
  private apiUrl = 'https://vip-reseller.co.id/api';
  private apiId: string;
  private apiKey: string;

  // Auth: api_id + api_key as query params or body
  async fetchProducts(): Promise<ProviderProductRaw[]> {
    // GET /game-feature with api_id and api_key
    // GET /services for prepaid products
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse> {
    // POST /game-feature-direct (instant games)
    // POST /prepaid (pulsa, data, PLN)
    // Body: { api_id, api_key, service, data_no, data_zone? }
  }

  async checkOrderStatus(refId: string): Promise<ProviderStatusResponse> {
    // POST /game-feature/inquiry or /prepaid/inquiry
    // Body: { api_id, api_key, trxid }
  }

  async checkBalance(): Promise<ProviderBalance> {
    // GET /profile with api_id and api_key
    // Returns balance in profile response
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    // VIP-Reseller uses callback URL with token validation
  }
}
```

### 1.5 Tokovoucher Adapter

```typescript
// services/provider/tokovoucher.adapter.ts

class TokovoucherAdapter implements IProviderAdapter {
  readonly name = 'Tokovoucher';
  readonly code = 'tokovoucher';
  
  private apiUrl = 'https://api.tokovoucher.id';
  private memberId: string;
  private secret: string;
  private pin: string;

  // Auth: signature = md5(memberId + secret + action)
  async fetchProducts(): Promise<ProviderProductRaw[]> {
    // POST /v1/produk/list
    // Body: { member_code, signature }
  }

  async createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse> {
    // POST /v1/transaksi
    // Body: { ref_id, produk, tujuan, member_code, pin, signature }
    // Signature: md5(member_code + secret + ref_id)
  }

  async checkOrderStatus(refId: string): Promise<ProviderStatusResponse> {
    // POST /v1/transaksi/status
    // Body: { ref_id, member_code, signature }
  }

  async checkBalance(): Promise<ProviderBalance> {
    // POST /v1/member/saldo
    // Body: { member_code, signature }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    // Verify: md5(memberId + secret + refId) matches
  }
}
```

### 1.6 Smart Provider Routing

```typescript
// services/provider/router.ts

class ProviderRouter {
  /**
   * Select the best provider for a given product order.
   * 
   * Routing algorithm:
   * 1. Get all provider_products for this product (where isActive=true)
   * 2. Filter out providers with health status = DOWN
   * 3. Filter out providers with insufficient balance
   * 4. Sort by: priority DESC, then price ASC
   * 5. Return top candidate
   * 6. If all fail, return null (trigger manual intervention)
   */
  async selectProvider(productId: string, amount: number): Promise<ProviderSelection | null> {
    // Step 1: Get active provider products
    const providerProducts = await this.getActiveProviderProducts(productId);
    
    // Step 2: Filter by health
    const healthy = providerProducts.filter(pp => {
      const health = this.circuitBreaker.getState(pp.providerId);
      return health !== 'OPEN';
    });
    
    // Step 3: Filter by balance
    const funded = healthy.filter(pp => {
      const balance = this.getProviderBalance(pp.providerId);
      return balance >= pp.providerPrice;
    });
    
    // Step 4: Sort by priority, then price
    funded.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return Number(a.providerPrice) - Number(b.providerPrice);
    });
    
    return funded[0] || null;
  }

  /**
   * Get fallback providers (excluding already-tried ones)
   */
  async getFallbackProviders(
    productId: string, 
    excludeProviderIds: string[]
  ): Promise<ProviderSelection[]> {
    // Same logic but excludes already-attempted providers
  }
}
```

### 1.7 Circuit Breaker (Per Provider)

```typescript
// services/provider/circuit-breaker.ts

interface CircuitBreakerConfig {
  failureThreshold: number;  // Failures before opening (default: 5)
  recoveryTimeout: number;   // Seconds before half-open (default: 60)
  monitorWindow: number;     // Time window for failure count (default: 120s)
}

class ProviderCircuitBreaker {
  private states: Map<string, CircuitState> = new Map();
  
  // States: CLOSED (normal) → OPEN (blocked) → HALF_OPEN (testing)
  
  async recordSuccess(providerId: string): void {
    // Reset failure count, set state to CLOSED
  }
  
  async recordFailure(providerId: string): void {
    // Increment failure count
    // If threshold exceeded → set state to OPEN, alert admin
  }
  
  getState(providerId: string): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    const state = this.states.get(providerId);
    if (!state) return 'CLOSED';
    
    if (state.status === 'OPEN') {
      // Check if recovery timeout has passed
      if (Date.now() - state.openedAt > state.recoveryTimeout) {
        return 'HALF_OPEN'; // Allow one test request
      }
      return 'OPEN';
    }
    return state.status;
  }
}
```

### 1.8 Product Sync Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 PRODUCT SYNC PIPELINE                      │
│                                                           │
│  1. Fetch from Provider API                               │
│     └── Paginated fetch, handle rate limits               │
│                                                           │
│  2. Normalize Response                                    │
│     └── Map provider-specific format → standard format    │
│                                                           │
│  3. Deduplication                                         │
│     └── Match by providerCode (SKU)                       │
│     └── If exists: update price, status                   │
│     └── If new: create product + provider_product         │
│                                                           │
│  4. Price Calculation                                     │
│     └── Apply markup rules (global → category → product) │
│     └── Calculate sellingPrice from basePrice + markup    │
│                                                           │
│  5. Availability Check                                    │
│     └── Products not in sync response → mark inactive    │
│     └── Products marked "gangguan" → mark MAINTENANCE    │
│                                                           │
│  6. Cache Invalidation                                    │
│     └── Clear product cache keys                          │
│     └── Clear category cache keys                         │
│                                                           │
│  7. Sync Report                                           │
│     └── Log: added X, updated X, disabled X, errors X    │
│     └── Notify admin if errors > threshold                │
└──────────────────────────────────────────────────────────┘
```

### 1.9 Provider Health Monitoring

```typescript
// Every 2 minutes, check each active provider
async function checkProviderHealth(provider: Provider): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Simple balance check as health indicator
    const balance = await adapter.checkBalance();
    const responseTime = Date.now() - startTime;
    
    return {
      providerId: provider.id,
      status: responseTime < 5000 ? 'HEALTHY' : 'DEGRADED',
      responseTime,
      balance: balance.balance,
    };
  } catch (error) {
    return {
      providerId: provider.id,
      status: 'DOWN',
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}
```

---

## 2. Payment Gateway Architecture

### 2.1 Payment Abstraction Layer

```
┌─────────────────────────────────────────────────────────┐
│                  PAYMENT SERVICE                          │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │           IPaymentAdapter Interface              │    │
│  │                                                   │    │
│  │  + createTransaction(params): PaymentResponse     │    │
│  │  + getPaymentMethods(): PaymentMethod[]           │    │
│  │  + checkStatus(txId): StatusResponse              │    │
│  │  + cancelTransaction(txId): void                  │    │
│  │  + verifyWebhook(headers, body): boolean          │    │
│  │  + parseWebhook(body): WebhookData                │    │
│  │  + calculateFee(amount, method): FeeCalc          │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│     ┌────────┬───────────┼───────────┬────────┐         │
│     │        │           │           │        │         │
│     ▼        ▼           ▼           ▼        ▼         │
│  ┌───────┐┌───────┐┌────────┐┌───────┐┌────────┐      │
│  │Midtrans││Xendit ││ Tripay ││Duitku ││Bayar.gg│      │
│  │Adapter ││Adapter││Adapter ││Adapter││Adapter │      │
│  └───────┘└───────┘└────────┘└───────┘└────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Payment Interface Definition

```typescript
// services/payment/payment.interface.ts

interface IPaymentAdapter {
  readonly name: string;
  readonly code: string; // midtrans, xendit, tripay, etc.
  
  // Transaction creation
  createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse>;
  
  // Status check
  checkTransactionStatus(gatewayRef: string): Promise<PaymentStatusResponse>;
  
  // Cancellation
  cancelTransaction(gatewayRef: string): Promise<void>;
  
  // Payment methods
  getAvailablePaymentMethods(): Promise<GatewayPaymentMethod[]>;
  
  // Fee calculation
  calculateFee(amount: number, methodCode: string): FeeCalculation;
  
  // Webhook verification
  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean;
  parseWebhookPayload(body: any): PaymentWebhookData;
}

interface CreatePaymentParams {
  orderId: string;         // Our invoice ID
  amount: number;          // Total amount in IDR
  methodCode: string;      // VA_BCA, QRIS, EWALLET_GOPAY
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  expiryMinutes?: number;  // Default: 60
  metadata?: Record<string, any>;
}

interface PaymentCreatedResponse {
  success: boolean;
  gatewayRef: string;      // Gateway's transaction ID
  paymentUrl?: string;     // Redirect URL / QR URL
  vaNumber?: string;       // Virtual account number
  qrCode?: string;         // QR code data/image URL
  expiresAt: Date;
  amount: number;
  fee: number;
  instructions?: PaymentInstruction[];
}

interface PaymentWebhookData {
  gatewayRef: string;
  orderId: string;        // Our invoice ID
  status: 'paid' | 'expired' | 'failed' | 'refunded';
  amount: number;
  paidAt?: Date;
  method?: string;
  rawData: any;
}
```



### 2.3 Midtrans Adapter

```typescript
// services/payment/midtrans.adapter.ts

class MidtransAdapter implements IPaymentAdapter {
  readonly name = 'Midtrans';
  readonly code = 'midtrans';
  
  private serverKey: string;
  private clientKey: string;
  private isSandbox: boolean;
  
  private get baseUrl(): string {
    return this.isSandbox
      ? 'https://api.sandbox.midtrans.com'
      : 'https://api.midtrans.com';
  }

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    // POST /v2/charge
    // Headers: Authorization: Basic base64(serverKey + ':')
    // Body structure depends on payment type:
    //   - bank_transfer (VA): { payment_type, bank_transfer: { bank }, transaction_details }
    //   - gopay: { payment_type: 'gopay', transaction_details }
    //   - qris: { payment_type: 'qris', transaction_details }
    //   - credit_card: use Snap Token approach
  }

  async checkTransactionStatus(gatewayRef: string): Promise<PaymentStatusResponse> {
    // GET /v2/{order_id}/status
    // Maps: settlement→paid, pending→pending, expire→expired, deny/cancel→failed
  }

  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean {
    // Midtrans signature: SHA512(order_id + status_code + gross_amount + serverKey)
    const expectedSig = sha512(
      body.order_id + body.status_code + body.gross_amount + this.serverKey
    );
    return body.signature_key === expectedSig;
  }

  parseWebhookPayload(body: any): PaymentWebhookData {
    return {
      gatewayRef: body.transaction_id,
      orderId: body.order_id,
      status: this.mapStatus(body.transaction_status),
      amount: parseInt(body.gross_amount),
      paidAt: body.settlement_time ? new Date(body.settlement_time) : undefined,
      method: body.payment_type,
      rawData: body,
    };
  }

  private mapStatus(status: string): PaymentWebhookData['status'] {
    const map: Record<string, any> = {
      'settlement': 'paid',
      'capture': 'paid',
      'pending': 'pending',
      'expire': 'expired',
      'deny': 'failed',
      'cancel': 'failed',
      'refund': 'refunded',
    };
    return map[status] || 'failed';
  }
}
```

### 2.4 Xendit Adapter

```typescript
// services/payment/xendit.adapter.ts

class XenditAdapter implements IPaymentAdapter {
  readonly name = 'Xendit';
  readonly code = 'xendit';
  
  private secretKey: string;
  private webhookToken: string;
  private baseUrl = 'https://api.xendit.co';

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    // Xendit uses different endpoints per payment type:
    // VA: POST /v2/invoices (unified invoice) or POST /callback_virtual_accounts
    // QRIS: POST /qr_codes
    // E-Wallet: POST /ewallets/charges
    
    // Recommended: Use Invoice API for unified approach
    // POST /v2/invoices
    // Headers: Authorization: Basic base64(secretKey + ':')
  }

  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean {
    // Xendit uses x-callback-token header
    return headers['x-callback-token'] === this.webhookToken;
  }

  parseWebhookPayload(body: any): PaymentWebhookData {
    return {
      gatewayRef: body.id,
      orderId: body.external_id,
      status: body.status === 'PAID' ? 'paid' : 'expired',
      amount: body.paid_amount || body.amount,
      paidAt: body.paid_at ? new Date(body.paid_at) : undefined,
      method: body.payment_method,
      rawData: body,
    };
  }
}
```

### 2.5 Tripay Adapter

```typescript
// services/payment/tripay.adapter.ts

class TripayAdapter implements IPaymentAdapter {
  readonly name = 'Tripay';
  readonly code = 'tripay';
  
  private apiKey: string;
  private privateKey: string;
  private merchantCode: string;
  private isSandbox: boolean;
  
  private get baseUrl(): string {
    return this.isSandbox
      ? 'https://tripay.co.id/api-sandbox'
      : 'https://tripay.co.id/api';
  }

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    // POST /transaction/create
    // Headers: Authorization: Bearer {apiKey}
    // Body: { method, merchant_ref, amount, customer_name, customer_email,
    //         customer_phone, order_items, callback_url, return_url, 
    //         expired_time, signature }
    // Signature: HMAC-SHA256(merchantCode + merchant_ref + amount, privateKey)
  }

  async getAvailablePaymentMethods(): Promise<GatewayPaymentMethod[]> {
    // GET /merchant/payment-channel
    // Returns all available payment channels with fees
  }

  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean {
    // Tripay signature verification:
    // HMAC-SHA256 of callback payload with private key
    const signature = hmacSHA256(JSON.stringify(body), this.privateKey);
    return headers['x-callback-signature'] === signature;
  }

  parseWebhookPayload(body: any): PaymentWebhookData {
    return {
      gatewayRef: body.reference,
      orderId: body.merchant_ref,
      status: body.status === 'PAID' ? 'paid' : 'expired',
      amount: body.total_amount,
      paidAt: body.paid_at ? new Date(body.paid_at * 1000) : undefined,
      method: body.payment_method,
      rawData: body,
    };
  }

  calculateFee(amount: number, methodCode: string): FeeCalculation {
    // Tripay provides fee info in payment channel response
    // flat_fee + (amount * percent_fee / 100)
  }
}
```

### 2.6 Bayar.gg Adapter

```typescript
// services/payment/bayargg.adapter.ts

class BayarGGAdapter implements IPaymentAdapter {
  readonly name = 'Bayar.gg';
  readonly code = 'bayargg';
  
  private apiKey: string;
  private baseUrl = 'https://api.bayar.gg';

  async createTransaction(params: CreatePaymentParams): Promise<PaymentCreatedResponse> {
    // POST /v1/orders
    // Headers: Authorization: Bearer {apiKey}
    // Body: { external_id, amount, payment_method, customer, items }
  }

  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean {
    // Verify using webhook secret or IP whitelist
  }
}
```

### 2.7 Payment Gateway Factory

```typescript
// services/payment/index.ts

class PaymentGatewayFactory {
  private adapters: Map<string, IPaymentAdapter> = new Map();
  
  constructor(gatewayConfigs: PaymentGatewayConfig[]) {
    for (const config of gatewayConfigs) {
      if (!config.isActive) continue;
      
      const adapter = this.createAdapter(config);
      if (adapter) {
        this.adapters.set(config.code, adapter);
      }
    }
  }

  private createAdapter(config: PaymentGatewayConfig): IPaymentAdapter | null {
    switch (config.code) {
      case 'midtrans': return new MidtransAdapter(config);
      case 'xendit': return new XenditAdapter(config);
      case 'tripay': return new TripayAdapter(config);
      case 'duitku': return new DuitkuAdapter(config);
      case 'bayargg': return new BayarGGAdapter(config);
      case 'pakasir': return new PakasirAdapter(config);
      default: return null;
    }
  }

  getAdapter(code: string): IPaymentAdapter {
    const adapter = this.adapters.get(code);
    if (!adapter) throw new Error(`Payment gateway ${code} not configured`);
    return adapter;
  }

  getAllActive(): IPaymentAdapter[] {
    return Array.from(this.adapters.values());
  }
}
```

---

## 3. Payment Flow Architecture

### 3.1 Complete Payment Flow

```
User selects product + payment method
              │
              ▼
┌─────────────────────────────────┐
│  1. Create Transaction          │
│     - Validate product          │
│     - Calculate price + fees    │
│     - Apply voucher (if any)    │
│     - Generate invoiceId        │
│     - Save to DB (status:PENDING)│
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  2. Create Payment              │
│     - Call gateway adapter      │
│     - Get payment URL/VA/QR     │
│     - Save PaymentRecord        │
│     - Set expiry timer          │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  3. Return to User              │
│     - Payment URL / Instructions│
│     - Countdown timer           │
│     - Invoice ID for tracking   │
└──────────────┬──────────────────┘
               │
        (User pays externally)
               │
               ▼
┌─────────────────────────────────┐
│  4. Webhook Received            │
│     - Verify signature          │
│     - Check idempotency         │
│     - Update PaymentRecord      │
│     - Update Transaction status │
└──────────────┬──────────────────┘
               │
          ┌────┴────┐
          │         │
       (PAID)    (EXPIRED/FAILED)
          │         │
          ▼         ▼
┌──────────────┐  ┌──────────────┐
│ 5a. Queue    │  │ 5b. Notify   │
│    order     │  │    user      │
│    processing│  │    (failed)  │
└──────────────┘  └──────────────┘
```

### 3.2 Markup & Fee Calculation

```typescript
// Pricing calculation engine

interface PriceCalculation {
  basePrice: number;        // Provider cost
  markup: number;           // Our margin
  sellingPrice: number;     // basePrice + markup
  discount: number;         // Voucher/flash sale discount
  gatewayFee: number;       // Payment gateway fee
  totalAmount: number;      // sellingPrice - discount + gatewayFee
}

function calculatePrice(params: {
  product: Product;
  providerProduct: ProviderProduct;
  paymentMethod: PaymentMethod;
  voucher?: Voucher;
  flashSaleItem?: FlashSaleProduct;
}): PriceCalculation {
  
  // 1. Start with provider price (basePrice)
  const basePrice = Number(params.providerProduct.providerPrice);
  
  // 2. Apply markup (priority: product > category > provider > global)
  const markup = calculateMarkup(params.product);
  const sellingPrice = basePrice + markup;
  
  // 3. Check flash sale override
  let effectivePrice = sellingPrice;
  if (params.flashSaleItem) {
    effectivePrice = Number(params.flashSaleItem.salePrice);
  }
  
  // 4. Apply voucher discount
  let discount = 0;
  if (params.voucher) {
    discount = calculateVoucherDiscount(params.voucher, effectivePrice);
  }
  
  // 5. Calculate gateway fee
  const gatewayFee = calculateGatewayFee(params.paymentMethod, effectivePrice - discount);
  
  // 6. Final amount
  const totalAmount = effectivePrice - discount + gatewayFee;
  
  return { basePrice, markup, sellingPrice: effectivePrice, discount, gatewayFee, totalAmount };
}
```

### 3.3 Payment Expiry Handling

```typescript
// Cron: Check expired payments every 5 minutes

async function expirePendingPayments(): Promise<void> {
  // Find transactions where:
  //   status = PENDING
  //   expiresAt < now()
  //   paymentStatus = UNPAID
  
  const expired = await prisma.transaction.findMany({
    where: {
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      expiresAt: { lt: new Date() },
    },
    take: 100, // Process in batches
  });
  
  for (const tx of expired) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'EXPIRED', paymentStatus: 'EXPIRED' },
    });
    
    // Release locked wallet balance (if wallet was used)
    if (tx.walletLocked) {
      await walletService.unlockBalance(tx.userId, tx.walletLockedAmount);
    }
    
    // Notify user
    await notificationQueue.add('payment-expired', {
      userId: tx.userId,
      transactionId: tx.id,
      invoiceId: tx.invoiceId,
    });
    
    // Log
    await transactionLogService.log(tx.id, 'expired', 'Payment expired');
  }
}
```

### 3.4 Dynamic Fee Configuration

```typescript
// Admin can configure fees per gateway per method

interface FeeConfig {
  gatewayCode: string;
  methodCode: string;
  feeType: 'PERCENTAGE' | 'FIXED' | 'BOTH';
  percentageValue: number;  // e.g., 2.5 means 2.5%
  fixedValue: number;       // e.g., 4000 means Rp 4,000
  chargedTo: 'USER' | 'PLATFORM'; // Who pays the fee
  minFee?: number;
  maxFee?: number;
}

// Example configurations:
// QRIS: 0.7% (platform absorbs)
// VA BCA: Rp 4,000 flat (charged to user)
// E-Wallet GoPay: 2% (charged to user)
// Credit Card: 2.9% + Rp 2,000 (charged to user)
```

---

## 4. Webhook Security & Processing

### 4.1 Webhook Handler Pattern

```typescript
// webhooks/midtrans.webhook.ts

router.post('/api/v1/webhook/midtrans', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Step 1: ALWAYS log first (before any processing)
    const webhookLog = await webhookLogService.create({
      source: 'midtrans',
      endpoint: '/api/v1/webhook/midtrans',
      headers: sanitizeHeaders(req.headers),
      payload: req.body,
    });

    // Step 2: Verify signature
    const adapter = paymentFactory.getAdapter('midtrans');
    const isValid = adapter.verifyWebhookSignature(req.headers, req.body);
    if (!isValid) {
      await webhookLogService.update(webhookLog.id, { statusCode: 401, error: 'Invalid signature' });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Step 3: Idempotency check
    const webhookId = req.body.transaction_id + ':' + req.body.transaction_status;
    const isNew = await idempotencyCheck(webhookId, 'midtrans');
    if (!isNew) {
      await webhookLogService.update(webhookLog.id, { statusCode: 200, response: { status: 'duplicate' } });
      return res.status(200).json({ status: 'already_processed' });
    }

    // Step 4: Parse and process
    const data = adapter.parseWebhookPayload(req.body);
    await paymentService.processWebhook(data);

    // Step 5: Update log and respond
    await webhookLogService.update(webhookLog.id, {
      statusCode: 200,
      processedAt: new Date(),
      response: { status: 'ok' },
    });

    return res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    logger.error('Webhook processing error', { source: 'midtrans', error });
    // Still return 200 to prevent retries for processing errors
    // (log the error for manual investigation)
    return res.status(200).json({ status: 'error_logged' });
  }
});
```

### 4.2 Payment Service: Process Webhook

```typescript
// modules/payments/payments.service.ts

async processWebhook(data: PaymentWebhookData): Promise<void> {
  // Find transaction by orderId (our invoiceId)
  const transaction = await transactionRepo.findByInvoiceId(data.orderId);
  if (!transaction) {
    logger.warn('Webhook for unknown transaction', { orderId: data.orderId });
    return;
  }

  // Prevent backward status transitions
  if (this.isTerminalStatus(transaction.paymentStatus)) {
    logger.info('Transaction already in terminal state', { id: transaction.id });
    return;
  }

  switch (data.status) {
    case 'paid':
      await this.handlePaymentSuccess(transaction, data);
      break;
    case 'expired':
      await this.handlePaymentExpired(transaction, data);
      break;
    case 'failed':
      await this.handlePaymentFailed(transaction, data);
      break;
    case 'refunded':
      await this.handlePaymentRefunded(transaction, data);
      break;
  }
}

private async handlePaymentSuccess(transaction: Transaction, data: PaymentWebhookData): Promise<void> {
  // 1. Update payment record
  await paymentRecordRepo.update(transaction.id, {
    status: 'PAID',
    paidAt: data.paidAt || new Date(),
    callbackData: data.rawData,
  });

  // 2. Update transaction status
  await transactionRepo.updateStatus(transaction.id, 'PAID', 'PAID');

  // 3. Log
  await transactionLogService.log(transaction.id, 'payment_received', 'Payment confirmed via webhook');

  // 4. Queue order processing
  await orderQueue.add('process-order', {
    transactionId: transaction.id,
    attemptNumber: 1,
    maxAttempts: 3,
  }, { priority: 1 });

  // 5. Emit events
  eventBus.emit('transaction.paid', { transaction, paymentData: data });
}
```

---

## 5. Admin Gateway Management

### 5.1 Gateway Configuration UI

```
Admin can configure per gateway:
├── API Keys (server key, secret key, merchant ID)
├── Mode (Sandbox / Live)
├── Status (Active / Inactive)
├── Priority (for method ordering)
├── Fee settings per payment method
├── Expiry time (minutes)
├── Webhook URL (auto-generated, displayed for copy)
├── IP whitelist (for providers that need it)
└── Test connection button
```

### 5.2 Dynamic API Key Management

```typescript
// All API keys stored encrypted in database
// Decrypted at runtime only when needed
// Keys never logged or exposed in responses

// Encryption: AES-256-GCM
function encryptApiKey(plainKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  // ... encrypt and return iv:tag:ciphertext
}

function decryptApiKey(encrypted: string): string {
  // ... decrypt and return plain key
}
```

---

*End of Document*
