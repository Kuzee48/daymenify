'use client';

import { useState } from 'react';
import {
  Settings,
  Power,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';

interface Gateway {
  id: string;
  name: string;
  mode: 'sandbox' | 'live';
  status: 'active' | 'inactive';
  transactionsToday: number;
  successRate: number;
  apiKey: string;
  secretKey: string;
}

const mockGateways: Gateway[] = [
  { id: '1', name: 'Tripay', mode: 'live', status: 'active', transactionsToday: 342, successRate: 99.8, apiKey: 'tp_live_****4521', secretKey: 'tp_secret_****8890' },
  { id: '2', name: 'Midtrans', mode: 'live', status: 'active', transactionsToday: 287, successRate: 99.5, apiKey: 'mid_server_****3344', secretKey: 'mid_client_****7712' },
  { id: '3', name: 'Xendit', mode: 'sandbox', status: 'active', transactionsToday: 156, successRate: 98.9, apiKey: 'xnd_dev_****6677', secretKey: 'xnd_secret_****0011' },
  { id: '4', name: 'Duitku', mode: 'live', status: 'active', transactionsToday: 98, successRate: 97.5, apiKey: 'dk_live_****9988', secretKey: 'dk_secret_****5544' },
  { id: '5', name: 'Bayar.gg', mode: 'sandbox', status: 'inactive', transactionsToday: 0, successRate: 0, apiKey: 'bg_test_****2233', secretKey: 'bg_secret_****6655' },
  { id: '6', name: 'Pakasir', mode: 'live', status: 'active', transactionsToday: 45, successRate: 99.1, apiKey: 'pk_live_****4455', secretKey: 'pk_secret_****8899' },
];

export default function GatewaysPage() {
  const [gateways, setGateways] = useState(mockGateways);
  const [configDialog, setConfigDialog] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [showKeys, setShowKeys] = useState(false);

  const toggleMode = (id: string) => {
    setGateways((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, mode: g.mode === 'live' ? 'sandbox' : 'live' } : g
      )
    );
  };

  const toggleStatus = (id: string) => {
    setGateways((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, status: g.status === 'active' ? 'inactive' : 'active' } : g
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Gateway</h1>
          <p className="text-sm text-muted-foreground">
            Kelola konfigurasi payment gateway
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gateway Aktif</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {gateways.filter((g) => g.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Transaksi Hari Ini</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {gateways.reduce((sum, g) => sum + g.transactionsToday, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Mode Live</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {gateways.filter((g) => g.mode === 'live').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Mode Sandbox</p>
            <p className="text-xl font-bold text-warning mt-1">
              {gateways.filter((g) => g.mode === 'sandbox').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gateway Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gateways.map((gateway) => (
          <Card key={gateway.id} className={cn(gateway.status === 'inactive' && 'opacity-60')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{gateway.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      gateway.mode === 'live'
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-warning/10 text-warning border-warning/20'
                    )}
                  >
                    {gateway.mode === 'live' ? 'Live' : 'Sandbox'}
                  </Badge>
                  <div className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    gateway.status === 'active' ? 'bg-success' : 'bg-muted-foreground'
                  )} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Transaksi Hari Ini</p>
                  <p className="text-sm font-bold text-foreground">{gateway.transactionsToday}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-sm font-bold text-foreground">
                    {gateway.successRate > 0 ? `${gateway.successRate}%` : '-'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mode</span>
                  <button
                    onClick={() => toggleMode(gateway.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors',
                      gateway.mode === 'live'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    )}
                  >
                    {gateway.mode === 'live' ? (
                      <ToggleRight className="h-3.5 w-3.5" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5" />
                    )}
                    {gateway.mode === 'live' ? 'Live' : 'Sandbox'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <button
                    onClick={() => toggleStatus(gateway.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors',
                      gateway.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {gateway.status === 'active' ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedGateway(gateway);
                  setConfigDialog(true);
                  setShowKeys(false);
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfigurasi {selectedGateway?.name}</DialogTitle>
            <DialogDescription>
              Perbarui API keys dan konfigurasi gateway
            </DialogDescription>
          </DialogHeader>
          {selectedGateway && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">API Key</label>
                <div className="relative">
                  <Input
                    type={showKeys ? 'text' : 'password'}
                    defaultValue={selectedGateway.apiKey}
                    className="pr-10"
                  />
                  <button
                    onClick={() => setShowKeys(!showKeys)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Secret Key</label>
                <div className="relative">
                  <Input
                    type={showKeys ? 'text' : 'password'}
                    defaultValue={selectedGateway.secretKey}
                    className="pr-10"
                  />
                  <button
                    onClick={() => setShowKeys(!showKeys)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Callback URL</label>
                <Input
                  readOnly
                  value={`https://api.daymenify.com/webhooks/payment/${selectedGateway.name.toLowerCase()}`}
                  className="bg-muted"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => setConfigDialog(false)}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
