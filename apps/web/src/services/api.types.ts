// API response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  isPopular: boolean;
  isFlashSale: boolean;
  rating: number;
  sold: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  productCount: number;
}

export interface Transaction {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  customerData: {
    userId?: string;
    serverId?: string;
    phone?: string;
  };
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  productId: string;
  customerData: {
    userId?: string;
    serverId?: string;
    phone?: string;
  };
  paymentMethod: string;
  voucherCode?: string;
}
