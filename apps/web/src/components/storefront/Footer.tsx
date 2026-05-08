import Link from 'next/link';

import { cn } from '@/lib/utils';

const footerSections = [
  {
    title: 'Produk',
    links: [
      { label: 'Game Top Up', href: '/categories/game-top-up' },
      { label: 'Pulsa & Data', href: '/categories/pulsa-data' },
      { label: 'Voucher Digital', href: '/categories/voucher-digital' },
      { label: 'Token Listrik', href: '/categories/token-listrik' },
      { label: 'E-Wallet', href: '/categories/e-wallet' },
      { label: 'Streaming', href: '/categories/streaming' },
    ],
  },
  {
    title: 'Perusahaan',
    links: [
      { label: 'Tentang Kami', href: '/about' },
      { label: 'Karir', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Mitra & Reseller', href: '/partners' },
      { label: 'Syarat & Ketentuan', href: '/terms' },
      { label: 'Kebijakan Privasi', href: '/privacy' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'Pusat Bantuan', href: '/help' },
      { label: 'Cara Pembayaran', href: '/help/payment' },
      { label: 'Cek Transaksi', href: '/check-transaction' },
      { label: 'Hubungi Kami', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
];

const paymentMethods = [
  'QRIS',
  'GoPay',
  'OVO',
  'DANA',
  'ShopeePay',
  'BCA',
  'Mandiri',
  'BRI',
  'BNI',
  'Alfamart',
  'Indomaret',
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <span className="text-sm font-bold text-white">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Daymenify</span>
            </Link>
            <p className="text-sm text-gray-600">
              Platform top up game & produk digital terpercaya di Indonesia. Proses cepat, harga murah, dan layanan 24/7.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="rounded-lg bg-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-300"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="#"
                className="rounded-lg bg-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-300"
                aria-label="Twitter"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#"
                className="rounded-lg bg-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-300"
                aria-label="YouTube"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-primary-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-10 border-t border-gray-200 pt-8">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">
            Metode Pembayaran
          </h4>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <div
                key={method}
                className={cn(
                  'flex h-8 items-center rounded-md border border-gray-200 bg-white px-3',
                  'text-xs font-medium text-gray-600'
                )}
              >
                {method}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Daymenify. Semua hak cipta dilindungi undang-undang.
          </p>
        </div>
      </div>
    </footer>
  );
}
