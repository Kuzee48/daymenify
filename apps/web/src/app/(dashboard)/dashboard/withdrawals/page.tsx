'use client';

import { useState } from 'react';
import {
  Wallet,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Smartphone,
  AlertCircle,
  Plus,
  Banknote,
} from 'lucide-react';

import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Types
interface Withdrawal {
  id: string;
  date: string;
  amount: number;
  method: string;
  bankAccount: string;
  accountName: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  note: string;
}

// Mock data
const withdrawalSummary = {
  availableBalance: 1850000,
  totalWithdrawn: 3750000,
  pendingWithdrawal: 200000,
};

const mockWithdrawals: Withdrawal[] = [
  {
    id: 'wd1',
    date: '2024-01-15T10:00:00Z',
    amount: 200000,
    method: 'Bank BCA',
    bankAccount: '****4521',
    accountName: 'Ah*** Su***',
    status: 'pending',
    note: 'Estimasi proses 1x24 jam',
  },
  {
    id: 'wd2',
    date: '2024-01-12T14:30:00Z',
    amount: 500000,
    method: 'Bank BNI',
    bankAccount: '****7832',
    accountName: 'Ah*** Su***',
    status: 'completed',
    note: 'Transfer berhasil',
  },
  {
    id: 'wd3',
    date: '2024-01-08T09:00:00Z',
    amount: 300000,
    method: 'GoPay',
    bankAccount: '0812****5678',
    accountName: 'Ah*** Su***',
    status: 'completed',
    note: 'Transfer berhasil',
  },
  {
    id: 'wd4',
    date: '2024-01-05T16:45:00Z',
    amount: 1000000,
    method: 'Bank BCA',
    bankAccount: '****4521',
    accountName: 'Ah*** Su***',
    status: 'completed',
    note: 'Transfer berhasil',
  },
  {
    id: 'wd5',
    date: '2024-01-02T11:00:00Z',
    amount: 150000,
    method: 'DANA',
    bankAccount: '0813****9012',
    accountName: 'Ah*** Su***',
    status: 'rejected',
    note: 'Nomor rekening tidak valid. Silakan cek kembali.',
  },
  {
    id: 'wd6',
    date: '2023-12-28T08:30:00Z',
    amount: 750000,
    method: 'Bank Mandiri',
    bankAccount: '****6543',
    accountName: 'Ah*** Su***',
    status: 'completed',
    note: 'Transfer berhasil',
  },
];

const statusConfig: Record<Withdrawal['status'], { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'PENDING', className: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  approved: { label: 'APPROVED', className: 'bg-primary-100 text-primary-700 border-primary-200', icon: CheckCircle },
  processing: { label: 'PROCESSING', className: 'bg-primary-100 text-primary-700 border-primary-200', icon: Clock },
  completed: { label: 'COMPLETED', className: 'bg-success/10 text-success border-success/20', icon: CheckCircle },
  rejected: { label: 'REJECTED', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

const withdrawMethods = [
  { id: 'bca', label: 'Bank BCA', type: 'bank' },
  { id: 'bni', label: 'Bank BNI', type: 'bank' },
  { id: 'bri', label: 'Bank BRI', type: 'bank' },
  { id: 'mandiri', label: 'Bank Mandiri', type: 'bank' },
  { id: 'gopay', label: 'GoPay', type: 'ewallet' },
  { id: 'ovo', label: 'OVO', type: 'ewallet' },
  { id: 'dana', label: 'DANA', type: 'ewallet' },
];

export default function WithdrawalsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const resetForm = () => {
    setAmount('');
    setMethod('');
    setAccountNumber('');
    setAccountName('');
  };

  const adminFee = amount ? Math.max(2500, Math.round(parseInt(amount) * 0.025)) : 0;
  const netAmount = amount ? parseInt(amount) - adminFee : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Riwayat Penarikan</h2>
          <p className="text-muted-foreground">
            Kelola dan pantau penarikan dana kamu.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tarik Dana
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Wallet className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Tersedia</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(withdrawalSummary.availableBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <ArrowUpCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Ditarik</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(withdrawalSummary.totalWithdrawn)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Penarikan</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(withdrawalSummary.pendingWithdrawal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Minimum Withdrawal Info */}
      <Card className="border-primary-200 bg-primary-50">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-primary-600" />
          <p className="text-sm text-primary-700">
            Min. penarikan: <span className="font-semibold">Rp 25.000</span>. 
            Biaya admin: <span className="font-semibold">2.5% (min. Rp 2.500)</span>. 
            Proses penarikan membutuhkan waktu 1x24 jam kerja.
          </p>
        </CardContent>
      </Card>

      {/* Withdrawal History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Penarikan</CardTitle>
          <CardDescription>Semua permintaan penarikan dana kamu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Rekening</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockWithdrawals.map((withdrawal) => {
                  const config = statusConfig[withdrawal.status];
                  return (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(withdrawal.date)}
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {formatCurrency(withdrawal.amount)}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {withdrawal.method}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {withdrawal.bankAccount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', config.className)}
                        >
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {withdrawal.note}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Withdrawal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tarik Dana</DialogTitle>
            <DialogDescription>
              Masukkan detail penarikan dana kamu. Min. Rp 25.000.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Amount */}
            <div>
              <p className="mb-2 text-sm font-medium">Nominal Penarikan</p>
              <Input
                type="number"
                placeholder="Masukkan nominal (min. Rp 25.000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amount && parseInt(amount) >= 25000 && (
                <div className="mt-2 space-y-1 rounded-lg bg-muted p-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Nominal</span>
                    <span>{formatCurrency(parseInt(amount))}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Biaya Admin (2.5%)</span>
                    <span className="text-destructive">-{formatCurrency(adminFee)}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between text-xs font-medium">
                    <span>Yang Diterima</span>
                    <span className="text-success">{formatCurrency(netAmount)}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Method Selection */}
            <div>
              <p className="mb-2 text-sm font-medium">Metode Penarikan</p>
              <div className="grid grid-cols-2 gap-2">
                {withdrawMethods.map((m) => (
                  <Button
                    key={m.id}
                    variant={method === m.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMethod(m.id)}
                    className="justify-start text-xs"
                  >
                    {m.type === 'bank' ? (
                      <Building2 className="mr-2 h-3 w-3" />
                    ) : (
                      <Smartphone className="mr-2 h-3 w-3" />
                    )}
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-sm font-medium">Nomor Rekening / E-Wallet</p>
                <Input
                  placeholder="Contoh: 1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Nama Pemilik Rekening</p>
                <Input
                  placeholder="Nama sesuai rekening / e-wallet"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); resetForm(); }}
            >
              Batal
            </Button>
            <Button
              disabled={
                !amount ||
                parseInt(amount) < 25000 ||
                parseInt(amount) > withdrawalSummary.availableBalance ||
                !method ||
                !accountNumber ||
                !accountName
              }
              onClick={() => { setDialogOpen(false); resetForm(); }}
            >
              <Banknote className="mr-2 h-4 w-4" />
              Ajukan Penarikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
