import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Share2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';

interface ArticleData {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  content: string[];
}

const articlesData: Record<string, ArticleData> = {
  'tips-top-up-ml-murah': {
    slug: 'tips-top-up-ml-murah',
    title: 'Tips Top Up ML Murah dan Aman di 2024',
    excerpt:
      'Ingin top up diamond Mobile Legends dengan harga murah? Simak tips dan trik mendapatkan diamond ML termurah dan terpercaya berikut ini.',
    category: 'Tips & Trik',
    date: '2024-01-15',
    author: 'Admin Daymenify',
    content: [
      'Mobile Legends: Bang Bang tetap menjadi salah satu game MOBA paling populer di Indonesia. Dengan jutaan pemain aktif setiap harinya, kebutuhan akan diamond ML terus meningkat. Diamond digunakan untuk membeli skin hero, efek recall, dan berbagai item eksklusif lainnya.',
      'Berikut adalah beberapa tips untuk mendapatkan diamond ML dengan harga murah dan aman:',
      '1. Gunakan Platform Terpercaya - Pastikan kamu menggunakan platform top up yang sudah terbukti aman dan memiliki reputasi baik. Daymenify menyediakan layanan top up ML dengan harga kompetitif dan proses yang cepat.',
      '2. Manfaatkan Promo dan Cashback - Selalu cek promo yang tersedia sebelum melakukan top up. Banyak platform menawarkan cashback atau diskon spesial pada momen-momen tertentu seperti anniversary game atau event besar.',
      '3. Beli dalam Jumlah Besar - Biasanya harga per diamond akan lebih murah jika kamu membeli dalam paket yang lebih besar. Misalnya, membeli 500+ diamonds biasanya lebih hemat dibanding membeli 86 diamonds berkali-kali.',
      '4. Gunakan Metode Pembayaran yang Tepat - Beberapa metode pembayaran mungkin menawarkan cashback tambahan. E-wallet seperti DANA, GoPay, dan OVO sering memberikan promo khusus untuk pembelian digital.',
      '5. Hindari Penipuan - Jangan tergiur dengan harga yang terlalu murah atau penawaran diamond gratis. Selalu gunakan platform resmi dan hindari transaksi dengan pihak yang tidak dikenal.',
    ],
  },
  'cara-beli-voucher-google-play': {
    slug: 'cara-beli-voucher-google-play',
    title: 'Cara Beli Voucher Google Play dengan Mudah',
    excerpt:
      'Panduan lengkap cara membeli voucher Google Play secara online. Proses cepat, aman, dan langsung masuk ke akun kamu.',
    category: 'Tutorial',
    date: '2024-01-12',
    author: 'Admin Daymenify',
    content: [
      'Voucher Google Play adalah salah satu produk digital yang paling banyak dicari. Dengan voucher ini, kamu bisa membeli aplikasi, game, film, buku, dan berbagai konten digital lainnya di Google Play Store.',
      'Berikut langkah-langkah mudah untuk membeli voucher Google Play di Daymenify:',
      '1. Kunjungi halaman produk Voucher Google Play di Daymenify atau cari melalui kolom pencarian.',
      '2. Pilih nominal voucher yang kamu inginkan (tersedia mulai dari Rp 20.000 hingga Rp 500.000).',
      '3. Masukkan email yang terdaftar di akun Google Play kamu.',
      '4. Pilih metode pembayaran yang tersedia (QRIS, e-wallet, bank transfer, atau minimarket).',
      '5. Selesaikan pembayaran dan kode voucher akan langsung dikirimkan ke email kamu.',
      'Proses biasanya hanya membutuhkan waktu 1-5 menit setelah pembayaran dikonfirmasi. Jika mengalami kendala, tim customer service kami siap membantu 24/7.',
    ],
  },
  'promo-cashback-ramadhan': {
    slug: 'promo-cashback-ramadhan',
    title: 'Promo Cashback Ramadhan: Diskon Hingga 30%',
    excerpt:
      'Spesial Ramadhan! Dapatkan cashback hingga 30% untuk semua pembelian top up game dan voucher digital.',
    category: 'Promo',
    date: '2024-01-10',
    author: 'Admin Daymenify',
    content: [
      'Menyambut bulan suci Ramadhan, Daymenify menghadirkan promo spesial dengan cashback hingga 30% untuk semua produk digital!',
      'Detail Promo:',
      '- Periode: Selama bulan Ramadhan 2024',
      '- Cashback 10% untuk pembelian pertama (maks. Rp 15.000)',
      '- Cashback 20% untuk pengguna baru (maks. Rp 25.000)',
      '- Cashback 30% untuk pembelian di atas Rp 100.000 (maks. Rp 50.000)',
      'Syarat dan Ketentuan:',
      '- Promo berlaku untuk semua metode pembayaran',
      '- Cashback akan dikreditkan dalam bentuk poin reward',
      '- Poin reward dapat digunakan untuk pembelian selanjutnya',
      '- Promo tidak dapat digabungkan dengan promo lainnya',
      'Jangan lewatkan kesempatan ini! Top up game favorit kamu sekarang dan nikmati cashback spesial Ramadhan dari Daymenify.',
    ],
  },
};

const relatedArticles = [
  {
    slug: 'panduan-top-up-genshin-impact',
    title: 'Panduan Top Up Genshin Impact: Genesis Crystal & Welkin',
    category: 'Tutorial',
    date: '2024-01-08',
  },
  {
    slug: 'metode-pembayaran-terlengkap',
    title: 'Metode Pembayaran Terlengkap di Daymenify',
    category: 'Info',
    date: '2024-01-05',
  },
  {
    slug: 'free-fire-advance-server',
    title: 'Free Fire Advance Server: Cara Daftar dan Fitur Baru',
    category: 'Game News',
    date: '2024-01-03',
  },
];

function formatArticleDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = articlesData[params.slug];
  if (!article) {
    return { title: 'Artikel Tidak Ditemukan - Daymenify' };
  }
  return {
    title: `${article.title} - Daymenify`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
    },
  };
}

export default function BlogArticlePage({ params }: PageProps) {
  const article = articlesData[params.slug];

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Artikel Tidak Ditemukan
        </h1>
        <p className="mt-2 text-muted-foreground">
          Maaf, artikel yang kamu cari tidak tersedia.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/blog">Kembali ke Blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Blog', href: '/blog' },
          { label: article.title },
        ]}
        className="mb-6"
      />

      {/* Article Header */}
      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Badge variant="secondary" className="mb-3">
            {article.category}
          </Badge>
          <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
            {article.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {article.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatArticleDate(article.date)}
            </span>
          </div>
        </header>

        <Separator className="my-6" />

        {/* Article Body */}
        <div className="prose prose-gray max-w-none">
          {article.content.map((paragraph, index) => (
            <p
              key={index}
              className="mb-4 text-foreground/90 leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Share Buttons */}
        <Separator className="my-8" />
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Bagikan:
          </span>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </article>

      {/* Related Articles */}
      <Separator className="my-12" />
      <section className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-2xl font-bold text-foreground">
          Artikel Terkait
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {relatedArticles.map((related) => (
            <Card
              key={related.slug}
              className="group transition-all hover:shadow-md"
            >
              <CardContent className="p-4">
                <Badge variant="secondary" className="mb-2 text-xs">
                  {related.category}
                </Badge>
                <Link href={`/blog/${related.slug}`}>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary-600 transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                </Link>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatArticleDate(related.date)}
                </p>
                <Link
                  href={`/blog/${related.slug}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600"
                >
                  Baca
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
