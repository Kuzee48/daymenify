import { CreditCard } from 'lucide-react';

import { cn } from '@/lib/utils';

const paymentMethods = [
  { name: 'QRIS', color: 'bg-purple-50 text-purple-700' },
  { name: 'GoPay', color: 'bg-blue-50 text-blue-700' },
  { name: 'OVO', color: 'bg-purple-50 text-purple-700' },
  { name: 'DANA', color: 'bg-sky-50 text-sky-700' },
  { name: 'BCA', color: 'bg-blue-50 text-blue-700' },
  { name: 'Mandiri', color: 'bg-yellow-50 text-yellow-700' },
  { name: 'BRI', color: 'bg-blue-50 text-blue-700' },
  { name: 'Alfamart', color: 'bg-red-50 text-red-700' },
];

export function PaymentMethods() {
  return (
    <section className="py-8">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
          Metode Pembayaran
        </h2>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Bayar dengan mudah menggunakan berbagai metode pembayaran pilihan kamu.
      </p>
      <div className="flex flex-wrap gap-2">
        {paymentMethods.map((method) => (
          <div
            key={method.name}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold',
              method.color
            )}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-white/60">
              <CreditCard className="h-3 w-3" />
            </div>
            {method.name}
          </div>
        ))}
      </div>
    </section>
  );
}
