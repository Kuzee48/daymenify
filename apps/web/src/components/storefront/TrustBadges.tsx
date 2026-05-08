import { Zap, Headphones, ShieldCheck, BadgeDollarSign } from 'lucide-react';

import { cn } from '@/lib/utils';

const badges = [
  {
    icon: Zap,
    title: 'Proses Instan',
    description: 'Pesanan langsung diproses otomatis',
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    icon: Headphones,
    title: '24/7 Layanan',
    description: 'Tim support siap membantu kapanpun',
    color: 'text-primary-600 bg-primary-50',
  },
  {
    icon: ShieldCheck,
    title: 'Aman & Terpercaya',
    description: 'Transaksi terenkripsi dan aman',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: BadgeDollarSign,
    title: 'Harga Terbaik',
    description: 'Harga kompetitif dan promo menarik',
    color: 'text-accent-600 bg-accent-50',
  },
];

export function TrustBadges() {
  return (
    <section className="py-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {badges.map((badge) => (
          <div
            key={badge.title}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 text-center"
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                badge.color
              )}
            >
              <badge.icon className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold text-gray-900 sm:text-sm">
              {badge.title}
            </h3>
            <p className="hidden text-xs text-gray-500 sm:block">
              {badge.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
