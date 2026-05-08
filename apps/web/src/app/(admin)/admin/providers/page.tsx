'use client';

import { useState } from 'react';
import {
  RefreshCw,
  Settings,
  Activity,
  Power,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Separator,
} from '@/components/ui';

interface Provider {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  balance: number;
  productCount: number;
  lastSync: string;
  successRate: number;
  isActive: boolean;
  transactionsToday: number;
  healthHistory: { time: string; status: 'online' | 'offline' | 'degraded' }[];
}

const mockProviders: Provider[] = [
  {
    id: '1',
    name: 'Digiflazz',
    status: 'online',
    balance: 85000000,
    productCount: 450,
    lastSync: '2 menit lalu',
    successRate: 99.5,
    isActive: true,
    transactionsToday: 847,
    healthHistory: [
      { time: '00:00', status: 'online' },
      { time: '04:00', status: 'online' },
      { time: '08:00', status: 'online' },
      { time: '12:00', status: 'degraded' },
      { time: '16:00', status: 'online' },
      { time: '20:00', status: 'online' },
    ],
  },
  {
    id: '2',
    name: 'VIP-Reseller',
    status: 'online',
    balance: 32000000,
    productCount: 320,
    lastSync: '5 menit lalu',
    successRate: 98.2,
    isActive: true,
    transactionsToday: 412,
    healthHistory: [
      { time: '00:00', status: 'online' },
      { time: '04:00', status: 'online' },
      { time: '08:00', status: 'online' },
      { time: '12:00', status: 'online' },
      { time: '16:00', status: 'online' },
      { time: '20:00', status: 'online' },
    ],
  },
  {
    id: '3',
    name: 'Tokovoucher',
    status: 'degraded',
    balance: 8000000,
    productCount: 280,
    lastSync: '15 menit lalu',
    successRate: 95.1,
    isActive: true,
    transactionsToday: 156,
    healthHistory: [
      { time: '00:00', status: 'online' },
      { time: '04:00', status: 'online' },
      { time: '08:00', status: 'offline' },
      { time: '12:00', status: 'degraded' },
      { time: '16:00', status: 'degraded' },
      { time: '20:00', status: 'degraded' },
    ],
  },
];

const statusConfig = {
  online: { label: 'Online', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  offline: { label: 'Offline', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  degraded: { label: 'Degraded', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState(mockProviders);

  const toggleProvider = (id: string) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Provider</h1>
          <p className="text-sm text-muted-foreground">
            Kelola dan monitor provider layanan digital
          </p>
        </div>
        <Button size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Semua
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Saldo Provider</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(125000000)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Produk</p>
            <p className="text-xl font-bold text-foreground mt-1">1.050</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Rata-rata Success Rate</p>
            <p className="text-xl font-bold text-foreground mt-1">97.6%</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {providers.map((provider) => {
          const statusInfo = statusConfig[provider.status];
          const StatusIcon = statusInfo.icon;
          const isLowBalance = provider.balance < 10000000;

          return (
            <Card key={provider.id} className={cn(!provider.isActive && 'opacity-60')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                  <div className={cn('flex items-center gap-1.5 rounded-full px-2 py-1', statusInfo.bg)}>
                    <StatusIcon className={cn('h-3.5 w-3.5', statusInfo.color)} />
                    <span className={cn('text-xs font-medium', statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Balance Warning */}
                {isLowBalance && (
                  <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 p-2.5">
                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                    <p className="text-xs text-warning">Saldo rendah! Segera top up.</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className={cn('text-sm font-bold', isLowBalance ? 'text-warning' : 'text-foreground')}>
                      {formatCurrency(provider.balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Produk</p>
                    <p className="text-sm font-bold text-foreground">{provider.productCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-sm font-bold text-foreground">{provider.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transaksi Hari Ini</p>
                    <p className="text-sm font-bold text-foreground">{provider.transactionsToday}</p>
                  </div>
                </div>

                {/* Health Timeline */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Health Timeline (24h)</p>
                  <div className="flex gap-1">
                    {provider.healthHistory.map((h, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-6 flex-1 rounded-sm',
                          h.status === 'online' && 'bg-success/60',
                          h.status === 'offline' && 'bg-destructive/60',
                          h.status === 'degraded' && 'bg-warning/60'
                        )}
                        title={`${h.time} - ${h.status}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">00:00</span>
                    <span className="text-[10px] text-muted-foreground">Sekarang</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Sync terakhir: {provider.lastSync}
                </div>

                <Separator />

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Health Check
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('text-xs', provider.isActive ? 'text-destructive' : 'text-success')}
                    onClick={() => toggleProvider(provider.id)}
                  >
                    <Power className="h-3 w-3 mr-1" />
                    {provider.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
