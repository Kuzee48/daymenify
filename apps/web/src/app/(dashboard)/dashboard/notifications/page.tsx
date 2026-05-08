'use client';

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Tag,
  Info,
  Bell,
  CheckCheck,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'transaction_success' | 'transaction_failed' | 'promo' | 'system';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'transaction_success',
    title: 'Transaksi Berhasil',
    message: 'Top up Mobile Legends 86 Diamonds berhasil! Diamond sudah masuk ke akun kamu.',
    createdAt: '2024-01-15T10:31:00Z',
    isRead: false,
  },
  {
    id: '2',
    type: 'promo',
    title: 'Promo Cashback 20%',
    message: 'Dapatkan cashback 20% untuk semua top up game hari ini. Gunakan kode GAMING20.',
    createdAt: '2024-01-15T08:00:00Z',
    isRead: false,
  },
  {
    id: '3',
    type: 'transaction_failed',
    title: 'Transaksi Gagal',
    message: 'Pembayaran untuk Pulsa Telkomsel 50.000 gagal. Silakan coba lagi.',
    createdAt: '2024-01-12T16:50:00Z',
    isRead: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'Maintenance Server',
    message: 'Akan ada maintenance server pada 20 Januari 2024 pukul 02:00 - 04:00 WIB.',
    createdAt: '2024-01-12T10:00:00Z',
    isRead: true,
  },
  {
    id: '5',
    type: 'promo',
    title: 'Flash Sale Spesial Weekend',
    message: 'Diskon hingga 30% untuk semua voucher game. Berlaku Sabtu-Minggu saja!',
    createdAt: '2024-01-11T12:00:00Z',
    isRead: true,
  },
  {
    id: '6',
    type: 'transaction_success',
    title: 'Transaksi Berhasil',
    message: 'Top up Free Fire 100 Diamonds berhasil! Diamond sudah masuk ke akun kamu.',
    createdAt: '2024-01-10T14:21:00Z',
    isRead: true,
  },
  {
    id: '7',
    type: 'system',
    title: 'Verifikasi Email',
    message: 'Segera verifikasi email kamu untuk mengaktifkan fitur keamanan tambahan.',
    createdAt: '2024-01-09T09:00:00Z',
    isRead: true,
  },
];

const notificationIcons: Record<Notification['type'], React.ReactNode> = {
  transaction_success: <CheckCircle className="h-5 w-5 text-success" />,
  transaction_failed: <XCircle className="h-5 w-5 text-destructive" />,
  promo: <Tag className="h-5 w-5 text-accent-600" />,
  system: <Info className="h-5 w-5 text-primary-600" />,
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notifikasi</h2>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca`
              : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Tandai semua dibaca
          </Button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                'cursor-pointer transition-colors hover:bg-muted/50',
                !notification.isRead && 'border-primary-200 bg-primary-50/30'
              )}
              onClick={() => markAsRead(notification.id)}
            >
              <CardContent className="flex gap-4 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-background">
                  {notificationIcons[notification.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={cn(
                        'text-sm',
                        !notification.isRead ? 'font-semibold' : 'font-medium'
                      )}
                    >
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <Badge
                        variant="default"
                        className="flex-shrink-0 bg-primary-500 text-[10px]"
                      >
                        Baru
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">
            Tidak ada notifikasi
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Notifikasi baru akan muncul di sini.
          </p>
        </div>
      )}
    </div>
  );
}
