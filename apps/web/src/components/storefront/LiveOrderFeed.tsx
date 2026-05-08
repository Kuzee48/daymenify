'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

import { cn } from '@/lib/utils';

interface OrderFeedItem {
  id: number;
  name: string;
  product: string;
  time: string;
}

const mockOrders: OrderFeedItem[] = [
  { id: 1, name: 'Ri***', product: 'topup 344 Diamond Mobile Legends', time: '2 menit lalu' },
  { id: 2, name: 'An***', product: 'beli Pulsa Telkomsel 50.000', time: '3 menit lalu' },
  { id: 3, name: 'De***', product: 'topup 100 Diamond Free Fire', time: '5 menit lalu' },
  { id: 4, name: 'Fi***', product: 'beli Token Listrik PLN 100.000', time: '6 menit lalu' },
  { id: 5, name: 'Bu***', product: 'topup 325 UC PUBG Mobile', time: '8 menit lalu' },
  { id: 6, name: 'Sa***', product: 'beli Voucher Google Play 50.000', time: '10 menit lalu' },
  { id: 7, name: 'Mu***', product: 'topup 60 Genesis Crystals Genshin', time: '12 menit lalu' },
  { id: 8, name: 'Nu***', product: 'beli Saldo DANA 50.000', time: '14 menit lalu' },
];

export function LiveOrderFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mockOrders.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const order = mockOrders[currentIndex];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </div>
        <span className="text-xs font-medium text-gray-600">
          Transaksi Terkini
        </span>
      </div>

      <div
        className={cn(
          'flex items-center gap-3 transition-all duration-300',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        )}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-50">
          <Activity className="h-4 w-4 text-green-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-gray-700">
            <span className="font-medium">{order.name}</span>{' '}
            baru saja {order.product}
          </p>
          <p className="text-xs text-gray-400">{order.time}</p>
        </div>
      </div>
    </div>
  );
}
