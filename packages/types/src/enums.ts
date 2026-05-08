// ============================================
// Core Enums (shared across frontend & backend)
// ============================================

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
  SUSPENDED = 'SUSPENDED',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  SUPPORT = 'support',
  FINANCE = 'finance',
  CUSTOMER = 'customer',
}

export enum ProductType {
  GAME_TOPUP = 'GAME_TOPUP',
  PULSA = 'PULSA',
  DATA_PACKAGE = 'DATA_PACKAGE',
  PLN_TOKEN = 'PLN_TOKEN',
  EWALLET = 'EWALLET',
  VOUCHER = 'VOUCHER',
  STREAMING = 'STREAMING',
  OTHER = 'OTHER',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  MAINTENANCE = 'MAINTENANCE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum ProviderType {
  DIGIFLAZZ = 'DIGIFLAZZ',
  VIP_RESELLER = 'VIP_RESELLER',
  TOKOVOUCHER = 'TOKOVOUCHER',
  CUSTOM = 'CUSTOM',
}
