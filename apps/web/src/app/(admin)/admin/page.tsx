'use client';

import { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  CheckCircle2,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';

const stats = [
  {
    label: 'Total Pendapatan',
    value: 847500000,
    change: '+12.5%',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-primary-500',
    bg: 'bg-primary-500/10',
  },
  {
    label: 'Transaksi Hari Ini',
    value: 1284,
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'text-accent-500',
    bg: 'bg-accent-500/10',
    isCurrency: false,
  },
  {
    label: 'Pengguna Baru',
    value: 156,
    change: '+23.1%',
    trend: 'up',
    icon: Users,
    color: 'text-success',
    bg: 'bg-success/10',
    isCurrency: false,
  },
  {
    label: 'Sukses Rate',
    value: 99.2,
    change: '+0.3%',
    trend: 'up',
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10',
    isCurrency: false,
    suffix: '%',
  },
  {
    label: 'Saldo Provider',
    value: 125000000,
    change: '-5.2%',
    trend: 'down',
    icon: Wallet,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    label: 'Antrian Pending',
    value: 23,
    change: '-12%',
    trend: 'down',
    icon: Clock,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    isCurrency: false,
  },
];

const revenueData = [
  { day: 'Sen', amount: 45000000 },
  { day: 'Sel', amount: 62000000 },
  { day: 'Rab', amount: 58000000 },
  { day: 'Kam', amount: 71000000 },
  { day: 'Jum', amount: 89000000 },
  { day: 'Sab', amount: 95000000 },
  { day: 'Min', amount: 78000000 },
];

const recentTransactions = [
  { id: 'INV-20240115-001', user: 'Ahmad Rizki', product: 'ML 86 Diamonds', amount: 28500, status: 'SUCCESS', time: '2 menit lalu' },
  { id: 'INV-20240115-002', user: 'Siti Nurhaliza', product: 'FF 720 Diamonds', amount: 145000, status: 'PENDING', time: '5 menit lalu' },
  { id: 'INV-20240115-003', user: 'Budi Santoso', product: 'Telkomsel 50rb', amount: 49500, status: 'SUCCESS', time: '8 menit lalu' },
  { id: 'INV-20240115-004', user: 'Dewi Lestari', product: 'PUBG 660 UC', amount: 159000, status: 'FAILED', time: '12 menit lalu' },
  { id: 'INV-20240115-005', user: 'Rendra Wijaya', product: 'XL 25rb', amount: 25500, status: 'SUCCESS', time: '15 menit lalu' },
];

const providerHealth = [
  { name: 'Digiflazz', status: 'online', balance: 85000000, successRate: 99.5, lastSync: '2 menit lalu' },
  { name: 'VIP-Reseller', status: 'online', balance: 32000000, successRate: 98.2, lastSync: '5 menit lalu' },
  { name: 'Tokovoucher', status: 'degraded', balance: 8000000, successRate: 95.1, lastSync: '15 menit lalu' },
];

const topProducts = [
  { name: 'Mobile Legends 86 Diamonds', sold: 1284, revenue: 36594000 },
  { name: 'Free Fire 720 Diamonds', sold: 856, revenue: 124120000 },
  { name: 'Telkomsel 50.000', sold: 743, revenue: 36778500 },
  { name: 'PUBG Mobile 660 UC', sold: 521, revenue: 82839000 },
  { name: 'Genshin Impact 330 Genesis', sold: 412, revenue: 33372000 },
];

export default function AdminDashboardPage() {
  const maxRevenue = Math.max(...revenueData.map((d) => d.amount));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan performa platform hari ini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={cn('rounded-lg p-2', stat.bg)}>
                    <Icon className={cn('h-4 w-4', stat.color)} />
                  </div>
                  <div className={cn(
                    'flex items-center gap-0.5 text-xs font-medium',
                    stat.trend === 'up' ? 'text-success' : 'text-destructive'
                  )}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    {stat.isCurrency === false
                      ? `${stat.value}${stat.suffix || ''}`
                      : formatCurrency(stat.value)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Chart & Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pendapatan Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {revenueData.map((item) => (
                <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <div
                      className="w-full max-w-[40px] rounded-t-md bg-primary-500/80 hover:bg-primary-500 transition-colors"
                      style={{ height: `${(item.amount / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={product.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.sold} terjual
                    </p>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Provider Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                      <TableCell className="text-sm">{tx.user}</TableCell>
                      <TableCell className="text-sm">{tx.product}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.status === 'SUCCESS'
                              ? 'default'
                              : tx.status === 'FAILED'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={cn(
                            tx.status === 'SUCCESS' && 'bg-success/10 text-success border-success/20',
                            tx.status === 'PENDING' && 'bg-warning/10 text-warning border-warning/20'
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Provider Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providerHealth.map((provider) => (
                <div key={provider.name} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{provider.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        provider.status === 'online' ? 'bg-success' : 'bg-warning'
                      )} />
                      <span className={cn(
                        'text-xs capitalize',
                        provider.status === 'online' ? 'text-success' : 'text-warning'
                      )}>
                        {provider.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Saldo</p>
                      <p className="font-medium text-foreground">{formatCurrency(provider.balance)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className="font-medium text-foreground">{provider.successRate}%</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Sync terakhir: {provider.lastSync}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
