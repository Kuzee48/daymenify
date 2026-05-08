import { MetadataRoute } from 'next';

const BASE_URL = 'https://daymenify.com';

// Mock category slugs
const categorySlugs = [
  'mobile-legends',
  'free-fire',
  'genshin-impact',
  'valorant',
  'pubg-mobile',
  'honkai-star-rail',
  'pulsa-data',
  'voucher-game',
  'e-wallet',
  'pln-token',
];

// Mock popular product slugs
const popularProductSlugs = [
  'mobile-legends-86-diamonds',
  'mobile-legends-172-diamonds',
  'mobile-legends-344-diamonds',
  'free-fire-100-diamonds',
  'free-fire-310-diamonds',
  'genshin-impact-welkin',
  'genshin-impact-60-genesis',
  'valorant-1000-vp',
  'pubg-mobile-60-uc',
  'pubg-mobile-325-uc',
  'voucher-google-play-50k',
  'voucher-google-play-100k',
  'pulsa-telkomsel-50k',
  'token-pln-100k',
];

// Mock blog slugs
const blogSlugs = [
  'tips-top-up-ml-murah',
  'cara-beli-voucher-google-play',
  'promo-cashback-ramadhan',
  'panduan-top-up-genshin-impact',
  'metode-pembayaran-terlengkap',
  'free-fire-advance-server',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${BASE_URL}/categories/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = popularProductSlugs.map((slug) => ({
    url: `${BASE_URL}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
}
