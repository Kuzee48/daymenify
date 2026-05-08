import type { ApiResponse, Category } from './api.types';

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Game Top Up',
    slug: 'game-top-up',
    description: 'Top up diamond, UC, dan item game favorit kamu dengan harga termurah.',
    icon: 'Gamepad2',
    productCount: 45,
  },
  {
    id: '2',
    name: 'Pulsa & Data',
    slug: 'pulsa-data',
    description: 'Isi ulang pulsa dan paket data semua operator dengan harga kompetitif.',
    icon: 'Smartphone',
    productCount: 30,
  },
  {
    id: '3',
    name: 'Voucher Digital',
    slug: 'voucher-digital',
    description: 'Voucher Google Play, Steam, PlayStation, dan platform digital lainnya.',
    icon: 'CreditCard',
    productCount: 20,
  },
  {
    id: '4',
    name: 'Token Listrik PLN',
    slug: 'token-listrik',
    description: 'Beli token listrik PLN prabayar dengan harga admin terendah.',
    icon: 'Zap',
    productCount: 10,
  },
  {
    id: '5',
    name: 'E-Wallet',
    slug: 'e-wallet',
    description: 'Top up saldo e-wallet GoPay, OVO, DANA, ShopeePay, dan lainnya.',
    icon: 'Wallet',
    productCount: 15,
  },
  {
    id: '6',
    name: 'Streaming',
    slug: 'streaming',
    description: 'Voucher Netflix, Spotify, YouTube Premium, dan layanan streaming lainnya.',
    icon: 'Tv',
    productCount: 12,
  },
];

const simulateDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const categoryService = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    await simulateDelay();

    return {
      success: true,
      message: 'Categories retrieved successfully',
      data: mockCategories,
    };
  },

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category | null>> {
    await simulateDelay();

    const category = mockCategories.find((c) => c.slug === slug) || null;

    return {
      success: !!category,
      message: category ? 'Category found' : 'Category not found',
      data: category,
    };
  },
};
