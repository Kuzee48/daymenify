'use client';

import { useEffect, useState } from 'react';
import { X, Megaphone } from 'lucide-react';

import { cn } from '@/lib/utils';

const STORAGE_KEY = 'daymenify-announcement-dismissed';

export function AnnouncementBar() {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (isDismissed) return null;

  return (
    <div
      className={cn(
        'relative bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-2 text-center text-sm text-white'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <Megaphone className="h-4 w-4 shrink-0" />
        <p className="truncate">
          🎉 Promo Spesial! Diskon hingga 20% untuk semua top up game. Berlaku sampai akhir bulan!
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-white/20"
        aria-label="Tutup pengumuman"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
