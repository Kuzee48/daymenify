import type { ApiResponse, PaginationParams, Product } from './api.types';

const mockProducts: Product[] = [
  {
    id: '1',
    slug: 'mobile-legends-86-diamonds',
    name: '86 Diamonds Mobile Legends',
    description: 'Top up 86 Diamonds untuk Mobile Legends: Bang Bang. Proses instan dan aman.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 19000,
    originalPrice: 22000,
    discount: 14,
    isPopular: true,
    isFlashSale: true,
    rating: 4.9,
    sold: 15420,
  },
  {
    id: '2',
    slug: 'mobile-legends-172-diamonds',
    name: '172 Diamonds Mobile Legends',
    description: 'Top up 172 Diamonds untuk Mobile Legends: Bang Bang. Proses instan dan aman.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 38000,
    originalPrice: 44000,
    discount: 14,
    isPopular: true,
    isFlashSale: false,
    rating: 4.8,
    sold: 12300,
  },
  {
    id: '3',
    slug: 'mobile-legends-344-diamonds',
    name: '344 Diamonds Mobile Legends',
    description: 'Top up 344 Diamonds untuk Mobile Legends: Bang Bang. Proses instan dan aman.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 75000,
    originalPrice: 88000,
    discount: 15,
    isPopular: true,
    isFlashSale: true,
    rating: 4.9,
    sold: 9870,
  },
  {
    id: '4',
    slug: 'free-fire-100-diamonds',
    name: '100 Diamonds Free Fire',
    description: 'Top up 100 Diamonds untuk Garena Free Fire. Proses cepat dan terpercaya.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 15000,
    originalPrice: 18000,
    discount: 17,
    isPopular: true,
    isFlashSale: true,
    rating: 4.7,
    sold: 8540,
  },
  {
    id: '5',
    slug: 'free-fire-310-diamonds',
    name: '310 Diamonds Free Fire',
    description: 'Top up 310 Diamonds untuk Garena Free Fire. Proses cepat dan terpercaya.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 45000,
    originalPrice: 50000,
    discount: 10,
    isPopular: true,
    isFlashSale: false,
    rating: 4.8,
    sold: 6230,
  },
  {
    id: '6',
    slug: 'pubg-mobile-60-uc',
    name: '60 UC PUBG Mobile',
    description: 'Top up 60 UC untuk PUBG Mobile. Unknown Cash untuk pembelian item in-game.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 15000,
    isPopular: false,
    isFlashSale: false,
    rating: 4.6,
    sold: 4520,
  },
  {
    id: '7',
    slug: 'pubg-mobile-325-uc',
    name: '325 UC PUBG Mobile',
    description: 'Top up 325 UC untuk PUBG Mobile. Unknown Cash untuk pembelian item in-game.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 75000,
    originalPrice: 82000,
    discount: 9,
    isPopular: true,
    isFlashSale: true,
    rating: 4.7,
    sold: 5180,
  },
  {
    id: '8',
    slug: 'genshin-impact-60-genesis-crystals',
    name: '60 Genesis Crystals Genshin Impact',
    description: 'Top up 60 Genesis Crystals untuk Genshin Impact. Langsung masuk ke akun.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 16000,
    isPopular: false,
    isFlashSale: false,
    rating: 4.8,
    sold: 3290,
  },
  {
    id: '9',
    slug: 'genshin-impact-330-genesis-crystals',
    name: '330 Genesis Crystals Genshin Impact',
    description: 'Top up 330 Genesis Crystals untuk Genshin Impact. Langsung masuk ke akun.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 79000,
    originalPrice: 85000,
    discount: 7,
    isPopular: true,
    isFlashSale: false,
    rating: 4.9,
    sold: 4100,
  },
  {
    id: '10',
    slug: 'pulsa-telkomsel-25000',
    name: 'Pulsa Telkomsel 25.000',
    description: 'Isi ulang pulsa Telkomsel nominal Rp25.000. Masuk instan ke nomor tujuan.',
    category: 'Pulsa & Data',
    categorySlug: 'pulsa-data',
    price: 26500,
    isPopular: true,
    isFlashSale: false,
    rating: 4.9,
    sold: 21000,
  },
  {
    id: '11',
    slug: 'pulsa-telkomsel-50000',
    name: 'Pulsa Telkomsel 50.000',
    description: 'Isi ulang pulsa Telkomsel nominal Rp50.000. Masuk instan ke nomor tujuan.',
    category: 'Pulsa & Data',
    categorySlug: 'pulsa-data',
    price: 51000,
    originalPrice: 53000,
    discount: 4,
    isPopular: true,
    isFlashSale: true,
    rating: 4.9,
    sold: 18500,
  },
  {
    id: '12',
    slug: 'pulsa-indosat-50000',
    name: 'Pulsa Indosat 50.000',
    description: 'Isi ulang pulsa Indosat Ooredoo nominal Rp50.000. Proses otomatis.',
    category: 'Pulsa & Data',
    categorySlug: 'pulsa-data',
    price: 50500,
    isPopular: false,
    isFlashSale: false,
    rating: 4.7,
    sold: 7600,
  },
  {
    id: '13',
    slug: 'voucher-google-play-50000',
    name: 'Voucher Google Play Rp50.000',
    description: 'Kode voucher Google Play Store senilai Rp50.000. Bisa digunakan untuk pembelian app & game.',
    category: 'Voucher Digital',
    categorySlug: 'voucher-digital',
    price: 50000,
    isPopular: true,
    isFlashSale: false,
    rating: 4.8,
    sold: 6800,
  },
  {
    id: '14',
    slug: 'voucher-google-play-100000',
    name: 'Voucher Google Play Rp100.000',
    description: 'Kode voucher Google Play Store senilai Rp100.000. Bisa digunakan untuk pembelian app & game.',
    category: 'Voucher Digital',
    categorySlug: 'voucher-digital',
    price: 99000,
    originalPrice: 100000,
    discount: 1,
    isPopular: true,
    isFlashSale: false,
    rating: 4.8,
    sold: 5200,
  },
  {
    id: '15',
    slug: 'token-listrik-pln-50000',
    name: 'Token Listrik PLN 50.000',
    description: 'Token listrik PLN Prabayar nominal Rp50.000. Langsung masuk ke meter.',
    category: 'Token Listrik PLN',
    categorySlug: 'token-listrik',
    price: 51500,
    isPopular: true,
    isFlashSale: false,
    rating: 4.9,
    sold: 14200,
  },
  {
    id: '16',
    slug: 'token-listrik-pln-100000',
    name: 'Token Listrik PLN 100.000',
    description: 'Token listrik PLN Prabayar nominal Rp100.000. Langsung masuk ke meter.',
    category: 'Token Listrik PLN',
    categorySlug: 'token-listrik',
    price: 101500,
    originalPrice: 103000,
    discount: 1,
    isPopular: true,
    isFlashSale: true,
    rating: 4.9,
    sold: 11800,
  },
  {
    id: '17',
    slug: 'valorant-125-vp',
    name: '125 VP Valorant',
    description: 'Top up 125 Valorant Points (VP). Bisa digunakan untuk membeli skin dan battle pass.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 15000,
    isPopular: false,
    isFlashSale: false,
    rating: 4.7,
    sold: 3100,
  },
  {
    id: '18',
    slug: 'honkai-star-rail-60-oneiric-shards',
    name: '60 Oneiric Shards Honkai Star Rail',
    description: 'Top up 60 Oneiric Shards untuk Honkai: Star Rail. Proses cepat dan aman.',
    category: 'Game Top Up',
    categorySlug: 'game-top-up',
    price: 16000,
    isPopular: false,
    isFlashSale: false,
    rating: 4.8,
    sold: 2800,
  },
  {
    id: '19',
    slug: 'saldo-dana-50000',
    name: 'Saldo DANA Rp50.000',
    description: 'Top up saldo DANA senilai Rp50.000. Masuk langsung ke akun DANA kamu.',
    category: 'E-Wallet',
    categorySlug: 'e-wallet',
    price: 51000,
    isPopular: true,
    isFlashSale: false,
    rating: 4.7,
    sold: 9200,
  },
  {
    id: '20',
    slug: 'netflix-premium-1-bulan',
    name: 'Netflix Premium 1 Bulan',
    description: 'Voucher akun Netflix Premium untuk 1 bulan. Streaming tanpa batas.',
    category: 'Streaming',
    categorySlug: 'streaming',
    price: 65000,
    originalPrice: 72000,
    discount: 10,
    isPopular: true,
    isFlashSale: true,
    rating: 4.6,
    sold: 4500,
  },
];

// Simulate API delay
const simulateDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const productService = {
  async getProducts(
    params?: PaginationParams & { category?: string }
  ): Promise<ApiResponse<Product[]>> {
    await simulateDelay();

    let filtered = [...mockProducts];

    if (params?.category) {
      filtered = filtered.filter((p) => p.categorySlug === params.category);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return {
      success: true,
      message: 'Products retrieved successfully',
      data: paginated,
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  },

  async getProductBySlug(slug: string): Promise<ApiResponse<Product | null>> {
    await simulateDelay();

    const product = mockProducts.find((p) => p.slug === slug) || null;

    return {
      success: !!product,
      message: product ? 'Product found' : 'Product not found',
      data: product,
    };
  },

  async getPopularProducts(): Promise<ApiResponse<Product[]>> {
    await simulateDelay();

    const popular = mockProducts.filter((p) => p.isPopular).slice(0, 6);

    return {
      success: true,
      message: 'Popular products retrieved successfully',
      data: popular,
    };
  },

  async getFlashSaleProducts(): Promise<ApiResponse<Product[]>> {
    await simulateDelay();

    const flashSale = mockProducts.filter((p) => p.isFlashSale);

    return {
      success: true,
      message: 'Flash sale products retrieved successfully',
      data: flashSale,
    };
  },

  async getRecommendedProducts(): Promise<ApiResponse<Product[]>> {
    await simulateDelay();

    const recommended = [...mockProducts]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 8);

    return {
      success: true,
      message: 'Recommended products retrieved successfully',
      data: recommended,
    };
  },

  async searchProducts(query: string): Promise<ApiResponse<Product[]>> {
    await simulateDelay(200);

    const lowerQuery = query.toLowerCase();
    const results = mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
    );

    return {
      success: true,
      message: `Found ${results.length} products`,
      data: results,
    };
  },
};
