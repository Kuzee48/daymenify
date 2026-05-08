import type { Metadata } from 'next';

const BASE_URL = 'https://daymenify.com';
const SITE_NAME = 'Daymenify';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

interface ProductSEO {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  categorySlug: string;
  image?: string;
  rating: number;
  sold: number;
}

interface CategorySEO {
  name: string;
  slug: string;
  description: string;
  productCount: number;
}

interface ArticleSEO {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  image?: string;
}

/**
 * Generate metadata for product pages
 */
export function generateProductMetadata(product: ProductSEO): Metadata {
  const title = `${product.name} - Top Up Murah | ${SITE_NAME}`;
  const description = `Beli ${product.name} dengan harga termurah mulai dari Rp ${product.price.toLocaleString('id-ID')}. Proses cepat, aman, dan terpercaya hanya di ${SITE_NAME}.`;
  const url = `${BASE_URL}/products/${product.slug}`;
  const image = product.image || DEFAULT_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Generate metadata for category pages
 */
export function generateCategoryMetadata(category: CategorySEO): Metadata {
  const title = `Top Up ${category.name} Murah & Cepat | ${SITE_NAME}`;
  const description = `Beli ${category.name} dengan harga termurah. Tersedia ${category.productCount} produk. Proses instan, pembayaran lengkap, dan terpercaya di ${SITE_NAME}.`;
  const url = `${BASE_URL}/categories/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: DEFAULT_IMAGE,
          width: 1200,
          height: 630,
          alt: `Top Up ${category.name} di ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_IMAGE],
    },
  };
}

/**
 * Generate metadata for blog article pages
 */
export function generateArticleMetadata(article: ArticleSEO): Metadata {
  const title = `${article.title} | Blog ${SITE_NAME}`;
  const description = article.excerpt;
  const url = `${BASE_URL}/blog/${article.slug}`;
  const image = article.image || DEFAULT_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Generate JSON-LD structured data
 */
export function generateStructuredData(
  type: 'Organization' | 'Product' | 'BreadcrumbList' | 'FAQPage' | 'Article',
  data: Record<string, unknown>
): Record<string, unknown> {
  switch (type) {
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: BASE_URL,
        logo: `${BASE_URL}/logo.png`,
        description:
          'Platform top up game dan voucher digital terpercaya di Indonesia. Harga termurah, proses cepat, pembayaran lengkap.',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+62-812-3456-7890',
          contactType: 'customer service',
          areaServed: 'ID',
          availableLanguage: 'Indonesian',
        },
        sameAs: [
          'https://instagram.com/daymenify',
          'https://twitter.com/daymenify',
          'https://facebook.com/daymenify',
        ],
        ...(data as object),
      };

    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.name as string,
        description: data.description as string,
        image: (data.image as string) || DEFAULT_IMAGE,
        brand: {
          '@type': 'Brand',
          name: data.category as string,
        },
        offers: {
          '@type': 'Offer',
          url: `${BASE_URL}/products/${data.slug as string}`,
          priceCurrency: 'IDR',
          price: data.price as number,
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: SITE_NAME,
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: data.rating as number,
          reviewCount: data.sold as number,
          bestRating: 5,
          worstRating: 1,
        },
      };

    case 'BreadcrumbList':
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: (
          data.items as { name: string; url?: string }[]
        ).map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url ? `${BASE_URL}${item.url}` : undefined,
        })),
      };

    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: (
          data.questions as { question: string; answer: string }[]
        ).map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };

    case 'Article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title as string,
        description: data.excerpt as string,
        image: (data.image as string) || DEFAULT_IMAGE,
        datePublished: data.date as string,
        dateModified: data.date as string,
        author: {
          '@type': 'Person',
          name: data.author as string,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/logo.png`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/blog/${data.slug as string}`,
        },
      };

    default:
      return {};
  }
}
