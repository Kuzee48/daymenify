'use client';

import Link from 'next/link';
import {
  Receipt,
  CheckCircle,
  Wallet,
  Star,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';

import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore, useFavoritesStore } from '@/store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { Transaction, Product } from '@/services/api.types';

// Mock data
const mockStats = {
  totalTransactions: 47,
  successfulTransactions: 42,
  totalSpending: 2450000,
  rewardPoints: 1250,
};

const mockRecentTransactions: Transaction[] = [
  {
    id: '1',
    invoiceId: 'INV-20240115-001',
    productId: 'p1',
    productName: 'Mobile Legends - 86 Diamonds',
    customerData: { userId: '123456', serverId: '7890' },
    amount: 22000,
    paymentMethod: 'QRIS',
    status: 'completed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:31:00Z',
  },
  {
    id: '2',
    invoiceId: 'INV-20240114-002',
    productId: 'p2',
    productName: 'Free Fire - 100 Diamonds',
    customerData: { userId: '654321' },
    amount: 15000,
    paymentMethod: 'GoPay',
    status: 'completed',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-14T14:21:00Z',
  },
  {
    id: '3',
    invoiceId: 'INV-20240113-003',
    productId: 'p3',
    productName: 'Genshin Impact - Blessing of the Welkin Moon',
    customerData: { userId: '789012' },
    amount: 75000,
    paymentMethod: 'Bank Transfer',
    status: 'pending',
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z',
  },
  {
    id: '4',
    invoiceId: 'INV-20240112-004',
    productId: 'p4',
    productName: 'Pulsa Telkomsel 50.000',
    customerData: { phone: '08123456789' },
    amount: 50000,
    paymentMethod: 'OVO',
    status: 'failed',
    createdAt: '2024-01-12T16:45:00Z',
    updatedAt: '2024-01-12T16:50:00Z',
  },
  {
    id: '5',
    invoiceId: 'INV-20240111-005',
    productId: 'p5',
    productName: 'Valorant - 1000 VP',
    customerData: { userId: 'riot#1234' },
    amount: 149000,
    paymentMethod: 'DANA',
    status: 'processing',
    createdAt: '2024-01-11T20:00:00Z',
    updatedAt: '2024-01-11T20:02:00Z',
  },
];

const mockFavoriteProducts: Product[] = [
  {
    id: 'fav1',
    slug: 'mobile-legends-86-diamonds',
    name: 'Mobile Legends - 86 Diamonds',
    description: 'Top up 86 diamonds Mobile Legends',
    category: 'Mobile Legends',
    categorySlug: 'mobile-legends',
    price: 22000,
    originalPrice: 25000,
    discount: 12,
    isPopular: true,
    isFlashSale: false,
    rating: 4.8,
    sold: 15230,
  },
  {
    id: 'fav2',
    slug: 'free-fire-100-diamonds',
    name: 'Free Fire - 100 Diamonds',
    description: 'Top up 100 diamonds Free Fire',
    category: 'Free Fire',
    categorySlug: 'free-fire',
    price: 15000,
    isPopular: true,
    isFlashSale: false,
    rating: 4.7,
    sold: 8920,
  },
  {
    id: 'fav3',
    slug: 'genshin-impact-welkin',
    name: 'Genshin Impact - Blessing of the Welkin Moon',
    description: 'Welkin Moon 30 days',
    category: 'Genshin Impact',
    categorySlug: 'genshin-impact',
    price: 75000,
    originalPrice: 85000,
    discount: 12,
    isPopular: true,
    isFlashSale: false,
    rating: 4.9,
    sold: 5430,
  },
];

const statusConfig: Record<
  Transaction['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  completed: { label: 'Berhasil', variant: 'default', className: 'bg-success/10 text-success border-success/20' },
  failed: { label: 'Gagal', variant: 'destructive', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  pending: { label: 'Menunggu', variant: 'outline', className: 'bg-warning/10 text-warning border-warning/20' },
  processing: { label: 'Diproses', variant: 'default', className: 'bg-primary-100 text-primary-700 border-primary-200' },
  expired: { label: 'Kedaluwarsa', variant: 'secondary', className: 'bg-muted text-muted-foreground' },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { items: favoriteIds } = useFavoritesStore();

  const displayName = user?.firstName || 'User';

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Halo, {displayName}!
        </h2>
        <p className="text-muted-foreground">
          Berikut ringkasan akun dan aktivitas terbaru kamu.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Receipt className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transaksi</p>
                <p className="text-lg font-bold text-foreground">
                  {mockStats.totalTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transaksi Sukses</p>
                <p className="text-lg font-bold text-foreground">
                  {mockStats.successfulTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
                <Wallet className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(mockStats.totalSpending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Poin Reward</p>
                <p className="text-lg font-bold text-foreground">
                  {mockStats.rewardPoints.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
            <CardDescription>5 transaksi terakhir kamu</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/transactions">
              Lihat Semua
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecentTransactions.map((tx) => {
                  const status = statusConfig[tx.status];
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">
                        {tx.invoiceId}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tx.productName}
                      </TableCell>
                      <TableCell>{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', status.className)}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/products">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Top Up Sekarang
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/transactions">
            <Receipt className="mr-2 h-4 w-4" />
            Lihat Semua Transaksi
          </Link>
        </Button>
      </div>

      {/* Favorite Products */}
      {mockFavoriteProducts.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Produk Favorit
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/favorites">
                Lihat Semua
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {mockFavoriteProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <Link href={`/products/${product.slug}`}>
                  <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <Badge variant="secondary" className="mb-1 text-[10px]">
                      {product.category}
                    </Badge>
                    <h4 className="line-clamp-2 text-sm font-medium">
                      {product.name}
                    </h4>
                    <p className="mt-1 text-sm font-bold text-primary-600">
                      {formatCurrency(product.price)}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
