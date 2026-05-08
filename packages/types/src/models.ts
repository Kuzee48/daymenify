import type { BaseEntity } from './common';
import type {
  ProductStatus,
  ProductType,
  ProviderType,
  TransactionStatus,
  PaymentStatus,
  UserRole,
  UserStatus,
} from './enums';

// ============================================
// Domain Model Types (API response shapes)
// ============================================

export interface User extends BaseEntity {
  email: string;
  name: string;
  phone: string | null;
  username: string | null;
  avatar: string | null;
  status: UserStatus;
  role: UserRole;
  emailVerified: boolean;
  referralCode: string;
}

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  productCount?: number;
}

export interface Product extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  categoryId: string;
  type: ProductType;
  status: ProductStatus;
  basePrice: number;
  sellingPrice: number;
  strikePrice: number | null;
  denomination: string | null;
  isFeatured: boolean;
  isPopular: boolean;
  totalSold: number;
  category?: Category;
}

export interface Provider extends BaseEntity {
  name: string;
  code: string;
  type: ProviderType;
  isActive: boolean;
  priority: number;
  balance: number | null;
}

export interface Transaction extends BaseEntity {
  invoiceId: string;
  userId: string;
  productId: string;
  productName: string;
  denomination: string | null;
  totalAmount: number;
  status: TransactionStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  serialNumber: string | null;
  completedAt: string | null;
}
