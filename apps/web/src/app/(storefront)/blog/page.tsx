import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Blog - Daymenify',
  description:
    'Tips, tutorial, dan informasi seputar top up game, voucher digital, dan promo menarik di Daymenify.',
  openGraph: {
    title: 'Blog - Daymenify',
    description:
      'Tips, tutorial, dan informasi seputar top up game, voucher digital, dan promo menarik di Daymenify.',
  },
};

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  thumbnail?: string;
}

const articles: Article[] = [
  {
    slug: 'tips-top-up-ml-murah',
    title: 'Tips Top Up ML Murah dan Aman di 2024',
    excerpt:
      'Ingin top up diamond Mobile Legends dengan harga murah? Simak tips dan trik mendapatkan diamond ML termurah dan terpercaya berikut ini.',
    category: 'Tips & Trik',
    date: '2024-01-15',
    author: 'Admin Daymenify',
  },
  {
    slug: 'cara-beli-voucher-google-play',
    title: 'Cara Beli Voucher Google Play dengan Mudah',
    excerpt:
      'Panduan lengkap cara membeli voucher Google Play secara online. Proses cepat, aman, dan langsung masuk ke akun kamu.',
    category: 'Tutorial',
    date: '2024-01-12',
    author: 'Admin Daymenify',
  },
  {
    slug: 'promo-cashback-ramadhan',
    title: 'Promo Cashback Ramadhan: Diskon Hingga 30%',
    excerpt:
      'Spesial Ramadhan! Dapatkan cashback hingga 30% untuk semua pembelian top up game dan voucher digital. Promo berlaku selama bulan Ramadhan.',
    category: 'Promo',
    date: '2024-01-10',
    author: 'Admin Daymenify',
  },
  {
    slug: 'panduan-top-up-genshin-impact',
    title: 'Panduan Top Up Genshin Impact: Genesis Crystal & Welkin',
    excerpt:
      'Cara mudah top up Genesis Crystal dan Blessing of the Welkin Moon untuk Genshin Impact. Harga termurah dan proses instan.',
    category: 'Tutorial',
    date: '2024-01-08',
    author: 'Admin Daymenify',
  },
  {
    slug: 'metode-pembayaran-terlengkap',
    title: 'Metode Pembayaran Terlengkap di Daymenify',
    excerpt:
      'Daymenify menyediakan berbagai metode pembayaran mulai dari e-wallet, bank transfer, hingga minimarket. Pilih yang paling nyaman untuk kamu.',
    category: 'Info',
    date: '2024-01-05',
    author: 'Admin Daymenify',
  },
  {
    slug: 'free-fire-advance-server',
    title: 'Free Fire Advance Server: Cara Daftar dan Fitur Baru',
    excerpt:
      'Update terbaru Free Fire Advance Server sudah tersedia! Simak cara mendaftar dan fitur-fitur baru yang menarik di sini.',
    category: 'Game News',
    date: '2024-01-03',
    author: 'Admin Daymenify',
  },
];

function formatArticleDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Tips, tutorial, dan informasi terbaru seputar top up game dan voucher
          digital.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Card
            key={article.slug}
            className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            {/* Thumbnail placeholder */}
            <div className="aspect-video bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
              <span className="text-4xl opacity-50">📝</span>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {article.category}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatArticleDate(article.date)}
                </span>
              </div>
              <Link href={`/blog/${article.slug}`}>
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary-600 transition-colors line-clamp-2">
                  {article.title}
                </h2>
              </Link>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {article.excerpt}
              </p>
              <Link
                href={`/blog/${article.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Baca Selengkapnya
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
