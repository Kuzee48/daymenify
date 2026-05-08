'use client';

import { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingBag,
  Gift,
  Users,
  Lock,
  Plus,
  Minus,
  CreditCard,
  Smartphone,
  Building2,
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { cn, formatCurrency, formatDate } from '@/lib/utils';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
interface WalletTransaction {
  id: string;
  date: string;
  type: 'deposit' | 'purchase' | 'cashback' | 'referral' | 'withdrawal';
  description: string;
  amount: number;
  balanceAfter: number;
}

// Mock wallet balances
const walletBalances = {
  main: 1850000,
  cashback: 127500,
  referral: 385000,
  locked: 50000,
};

// Mock transactions
const mockWalletTransactions: WalletTransaction[] = [
  {
    id: 'wt1',
    date: '2024-01-15T14:30:00Z',
    type: 'deposit',
    description: 'Deposit via QRIS',
    amount: 500000,
    balanceAfter: 1850000,
  },
  {
    id: 'wt2',
    date: '2024-01-15T10:15:00Z',
    type: 'purchase',
    description: 'Mobile Legends - 86 Diamonds',
    amount: -22000,
    balanceAfter: 1350000,
  },
  {
    id: 'wt3',
    date: '2024-01-14T18:00:00Z',
    type: 'cashback',
    description: 'Cashback pembelian Genshin Impact',
    amount: 7500,
    balanceAfter: 1372000,
  },
  {
    id: 'wt4',
    date: '2024-01-14T12:30:00Z',
    type: 'referral',
    description: 'Komisi referral dari Ah***',
    amount: 15000,
    balanceAfter: 1364500,
  },
  {
    id: 'wt5',
    date: '2024-01-13T20:00:00Z',
    type: 'purchase',
    description: 'Pulsa Telkomsel 50.000',
    amount: -50000,
    balanceAfter: 1349500,
  },
  {
    id: 'wt6',
    date: '2024-01-13T09:00:00Z',
    type: 'deposit',
    description: 'Deposit via Bank Transfer (BCA)',
    amount: 1000000,
    balanceAfter: 1399500,
  },
  {
    id: 'wt7',
    date: '2024-01-12T16:45:00Z',
    type: 'withdrawal',
    description: 'Penarikan ke BCA ****4521',
    amount: -200000,
    balanceAfter: 399500,
  },
  {
    id: 'wt8',
    date: '2024-01-12T11:20:00Z',
    type: 'cashback',
    description: 'Cashback pembelian Free Fire',
    amount: 3000,
    balanceAfter: 599500,
  },
  {
    id: 'wt9',
    date: '2024-01-11T15:30:00Z',
    type: 'purchase',
    description: 'Valorant - 1000 VP',
    amount: -149000,
    balanceAfter: 596500,
  },
  {
    id: 'wt10',
    date: '2024-01-10T08:00:00Z',
    type: 'deposit',
    description: 'Deposit via GoPay',
    amount: 200000,
    balanceAfter: 745500,
  },
  {
    id: 'wt11',
    date: '2024-01-09T19:45:00Z',
    type: 'referral',
    description: 'Komisi referral dari Bu***',
    amount: 8500,
    balanceAfter: 545500,
  },
  {
    id: 'wt12',
    date: '2024-01-08T14:00:00Z',
    type: 'purchase',
    description: 'Token PLN 100.000',
    amount: -100000,
    balanceAfter: 537000,
  },
];

const typeConfig: Record<WalletTransaction['type'], { label: string; icon: typeof Wallet; className: string }> = {
  deposit: { label: 'Deposit', icon: ArrowDownCircle, className: 'text-success' },
  purchase: { label: 'Pembelian', icon: ShoppingBag, className: 'text-destructive' },
  cashback: { label: 'Cashback', icon: Gift, className: 'text-success' },
  referral: { label: 'Referral', icon: Users, className: 'text-success' },
  withdrawal: { label: 'Penarikan', icon: ArrowUpCircle, className: 'text-destructive' },
};

const depositAmounts = [50000, 100000, 200000, 500000, 1000000];

const paymentMethods = [
  { id: 'qris', label: 'QRIS', icon: QrCode },
  { id: 'gopay', label: 'GoPay', icon: Smartphone },
  { id: 'ovo', label: 'OVO', icon: Smartphone },
  { id: 'dana', label: 'DANA', icon: Smartphone },
  { id: 'bca', label: 'Bank BCA', icon: Building2 },
  { id: 'bni', label: 'Bank BNI', icon: Building2 },
  { id: 'mandiri', label: 'Bank Mandiri', icon: Building2 },
];

const withdrawMethods = [
  { id: 'bca', label: 'Bank BCA', type: 'bank' },
  { id: 'bni', label: 'Bank BNI', type: 'bank' },
  { id: 'bri', label: 'Bank BRI', type: 'bank' },
  { id: 'mandiri', label: 'Bank Mandiri', type: 'bank' },
  { id: 'gopay', label: 'GoPay', type: 'ewallet' },
  { id: 'ovo', label: 'OVO', type: 'ewallet' },
  { id: 'dana', label: 'DANA', type: 'ewallet' },
];

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [customDeposit, setCustomDeposit] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawName, setWithdrawName] = useState('');

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return mockWalletTransactions;
    const typeMap: Record<string, WalletTransaction['type']> = {
      deposit: 'deposit',
      purchase: 'purchase',
      cashback: 'cashback',
      referral: 'referral',
      withdrawal: 'withdrawal',
    };
    return mockWalletTransactions.filter((tx) => tx.type === typeMap[activeTab]);
  }, [activeTab]);

  const finalDepositAmount = depositAmount || (customDeposit ? parseInt(customDeposit) : 0);

  const resetDeposit = () => {
    setDepositAmount(null);
    setCustomDeposit('');
    setSelectedPayment('');
  };

  const resetWithdraw = () => {
    setWithdrawAmount('');
    setWithdrawMethod('');
    setWithdrawAccount('');
    setWithdrawName('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dompet Saya</h2>
        <p className="text-muted-foreground">
          Kelola saldo dan riwayat transaksi dompet kamu.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Main Balance - Larger */}
        <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-200">
                <Wallet className="h-6 w-6 text-primary-700" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary-600">Saldo Utama</p>
                <p className="text-xl font-bold text-primary-900">
                  {formatCurrency(walletBalances.main)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Gift className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Cashback</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(walletBalances.cashback)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
                <Users className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Referral</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(walletBalances.referral)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Lock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Tertahan</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(walletBalances.locked)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setDepositOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Deposit
        </Button>
        <Button variant="outline" onClick={() => setWithdrawOpen(true)}>
          <Minus className="mr-2 h-4 w-4" />
          Tarik Dana
        </Button>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Transaksi Dompet</CardTitle>
          <CardDescription>Semua aktivitas saldo dompet kamu</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="purchase">Pembelian</TabsTrigger>
              <TabsTrigger value="cashback">Cashback</TabsTrigger>
              <TabsTrigger value="referral">Referral</TabsTrigger>
              <TabsTrigger value="withdrawal">Penarikan</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead className="text-right">Saldo Setelah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx) => {
                      const config = typeConfig[tx.type];
                      const Icon = config.icon;
                      const isCredit = tx.amount > 0;
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(tx.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className={cn('h-4 w-4', config.className)} />
                              <span className="text-sm">{config.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {tx.description}
                          </TableCell>
                          <TableCell className={cn('text-right font-medium whitespace-nowrap', isCredit ? 'text-success' : 'text-destructive')}>
                            {isCredit ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                            {formatCurrency(tx.balanceAfter)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredTransactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Belum ada transaksi pada kategori ini.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={(open) => { setDepositOpen(open); if (!open) resetDeposit(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit Saldo</DialogTitle>
            <DialogDescription>
              Pilih nominal dan metode pembayaran untuk deposit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Amount Selection */}
            <div>
              <p className="mb-2 text-sm font-medium">Pilih Nominal</p>
              <div className="grid grid-cols-3 gap-2">
                {depositAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={depositAmount === amount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setDepositAmount(amount); setCustomDeposit(''); }}
                    className="text-xs"
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
                <div className="col-span-3">
                  <Input
                    type="number"
                    placeholder="Nominal lainnya (min. Rp 10.000)"
                    value={customDeposit}
                    onChange={(e) => { setCustomDeposit(e.target.value); setDepositAmount(null); }}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Method */}
            <div>
              <p className="mb-2 text-sm font-medium">Metode Pembayaran</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <Button
                      key={method.id}
                      variant={selectedPayment === method.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPayment(method.id)}
                      className="justify-start gap-2 text-xs"
                    >
                      <Icon className="h-4 w-4" />
                      {method.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDepositOpen(false); resetDeposit(); }}
            >
              Batal
            </Button>
            <Button
              disabled={!finalDepositAmount || finalDepositAmount < 10000 || !selectedPayment}
              onClick={() => { setDepositOpen(false); resetDeposit(); }}
            >
              Deposit {finalDepositAmount > 0 ? formatCurrency(finalDepositAmount) : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={(open) => { setWithdrawOpen(open); if (!open) resetWithdraw(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tarik Dana</DialogTitle>
            <DialogDescription>
              Masukkan nominal dan detail rekening tujuan penarikan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Amount */}
            <div>
              <p className="mb-2 text-sm font-medium">Nominal Penarikan</p>
              <Input
                type="number"
                placeholder="Min. Rp 25.000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Saldo tersedia: {formatCurrency(walletBalances.main)}. Biaya admin: 2.5% (min. Rp 2.500)
              </p>
            </div>

            <Separator />

            {/* Method */}
            <div>
              <p className="mb-2 text-sm font-medium">Metode Penarikan</p>
              <div className="grid grid-cols-2 gap-2">
                {withdrawMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant={withdrawMethod === method.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWithdrawMethod(method.id)}
                    className="justify-start text-xs"
                  >
                    {method.type === 'bank' ? (
                      <Building2 className="mr-2 h-3 w-3" />
                    ) : (
                      <Smartphone className="mr-2 h-3 w-3" />
                    )}
                    {method.label}
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
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Nama Pemilik</p>
                <Input
                  placeholder="Nama sesuai rekening"
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setWithdrawOpen(false); resetWithdraw(); }}
            >
              Batal
            </Button>
            <Button
              disabled={
                !withdrawAmount ||
                parseInt(withdrawAmount) < 25000 ||
                !withdrawMethod ||
                !withdrawAccount ||
                !withdrawName
              }
              onClick={() => { setWithdrawOpen(false); resetWithdraw(); }}
            >
              Tarik Dana
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
