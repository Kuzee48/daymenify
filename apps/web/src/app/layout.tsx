import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '@/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Daymenify - Top Up & Marketplace Digital',
    template: '%s | Daymenify',
  },
  description:
    'Platform top up game, voucher digital, dan marketplace produk digital terpercaya di Indonesia. Proses instan, harga terbaik, dan transaksi aman.',
  keywords: [
    'top up game',
    'voucher digital',
    'marketplace digital',
    'pulsa',
    'token listrik',
    'mobile legends',
    'free fire',
    'genshin impact',
  ],
  authors: [{ name: 'Daymenify' }],
  creator: 'Daymenify',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Daymenify',
    title: 'Daymenify - Top Up & Marketplace Digital',
    description:
      'Platform top up game, voucher digital, dan marketplace produk digital terpercaya.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daymenify - Top Up & Marketplace Digital',
    description:
      'Platform top up game, voucher digital, dan marketplace produk digital terpercaya.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
