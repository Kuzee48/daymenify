'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
}

const banners: Banner[] = [
  {
    id: 1,
    title: 'Top Up Game Termurah',
    subtitle: 'Diskon hingga 20% untuk Mobile Legends, Free Fire, PUBG Mobile, dan game lainnya!',
    cta: 'Top Up Sekarang',
    href: '/categories/game-top-up',
    gradient: 'from-primary-600 via-primary-700 to-accent-700',
  },
  {
    id: 2,
    title: 'Promo Pulsa & Data',
    subtitle: 'Isi ulang pulsa semua operator dengan cashback hingga Rp10.000. Berlaku hari ini!',
    cta: 'Beli Pulsa',
    href: '/categories/pulsa-data',
    gradient: 'from-accent-600 via-accent-700 to-primary-700',
  },
  {
    id: 3,
    title: 'Flash Sale Voucher Digital',
    subtitle: 'Voucher Google Play, Steam, Netflix, dan lainnya dengan harga spesial terbatas!',
    cta: 'Lihat Promo',
    href: '/categories/voucher-digital',
    gradient: 'from-emerald-600 via-teal-700 to-primary-700',
  },
];

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className="relative w-full overflow-hidden rounded-none sm:rounded-2xl">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={cn(
              'min-w-full bg-gradient-to-r px-6 py-12 sm:px-12 sm:py-16 lg:py-20',
              banner.gradient
            )}
          >
            <div className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                {banner.title}
              </h2>
              <p className="mt-3 text-sm text-white/90 sm:text-base lg:text-lg">
                {banner.subtitle}
              </p>
              <Button
                size="lg"
                className="mt-6 bg-white text-gray-900 hover:bg-gray-100"
                asChild
              >
                <a href={banner.href}>{banner.cta}</a>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              currentSlide === index
                ? 'w-6 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            )}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
