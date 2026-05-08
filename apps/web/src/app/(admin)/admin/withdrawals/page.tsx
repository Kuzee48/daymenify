'use client';

import { useState } from 'react';
import {
  Search,
  Check,
  X,
  Wallet,
  Clock,
  ArrowDownToLine,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';

type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

interface MockWithdrawal {
  id: string;
  user: string;
  amount: number;
  method: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: WithdrawalStatus;
  createdAt: string;
}

const mockWithdrawals: MockWithdrawal[] = [
  { id: '1', user: 'Rendra Wijaya', amount: 5000000, method: 'Bank Transfer', bankName: 'BCA', accountNumber: '8901234567', accountHolder: 'Rendra Wijaya', status: 'PENDING', createdAt: '2024-01-15T10:30:00' },
  { id: '2', user: 'Siti Nurhaliza', amount: 2000000, method: 'Bank Transfer', bankName: 'BNI', accountNumber: '0012345678', accountHolder: 'Siti Nurhaliza', status: 'PENDING', createdAt: '2024-01-15T09:45:00' },
  { id: '3', user: 'Anisa Fitriani', amount: 3500000, method: 'E-Wallet', bankName: 'OVO', accountNumber: '081234567890', accountHolder: 'Anisa Fitriani', status: 'PENDING', createdAt: '2024-01-15T08:20:00' },
  { id: '4', user: 'Ahmad Rizki', amount: 1500000, method: 'Bank Transfer', bankName: 'Mandiri', accountNumber: '1234567890123', accountHolder: 'Ahmad Rizki Pratama', status: 'APPROVED', createdAt: '2024-01-14T16:30:00' },
  { id: '5', user: 'Hendra Gunawan', amount: 7500000, method: 'Bank Transfer', bankName: 'BRI', accountNumber: '0098765432', accountHolder: 'Hendra Gunawan', status: 'COMPLETED', createdAt: '2024-01-14T14:15:00' },
  { id: '6', user: 'Dimas Prasetyo', amount: 500000, method: 'E-Wallet', bankName: 'DANA', accountNumber: '085678901234', accountHolder: 'Dimas Prasetyo', status: 'REJECTED', createdAt: '2024-01-14T11:00:00' },
  { id: '7', user: 'Putri Anggraini', amount: 2750000, method: 'Bank Transfer', bankName: 'BCA', accountNumber: '7654321098', accountHolder: 'Putri Anggraini', status: 'COMPLETED', createdAt: '2024-01-13T09:30:00' },
  { id: '8', user: 'Yoga Pratama', amount: 1000000, method: 'E-Wallet', bankName: 'GoPay', accountNumber: '082345678901', accountHolder: 'Yoga Pratama', status: 'PENDING', createdAt: '2024-01-15T07:00:00' },
];

const statusConfig: Record<WithdrawalStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  APPROVED: { label: 'Disetujui', className: 'bg-primary-500/10 text-primary-500 border-primary-500/20' },
  REJECTED: { label: 'Ditolak', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  COMPLETED: { label: 'Selesai', className: 'bg-success/10 text-success border-success/20' },
};

export default function WithdrawalsPage() {
  const [activeTab, setActiveTab] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'approve' | 'reject'; withdrawal: MockWithdrawal | null }>({
    open: false,
    type: 'approve',
    withdrawal: null,
  });

  const filteredWithdrawals = mockWithdrawals.filter((w) => {
    const matchTab = activeTab === 'ALL' || w.status === activeTab;
    const matchSearch = w.user.toLowerCase().includes(search.toLowerCase()) ||
      w.accountNumber.includes(search);
    return matchTab && matchSearch;
  });

  const pendingTotal = mockWithdrawals
    .filter((w) => w.status === 'PENDING')
    .reduce((sum, w) => sum + w.amount, 0);

  const statusCounts = {
    ALL: mockWithdrawals.length,
    PENDING: mockWithdrawals.filter((w) => w.status === 'PENDING').length,
    APPROVED: mockWithdrawals.filter((w) => w.status === 'APPROVED').length,
    REJECTED: mockWithdrawals.filter((w) => w.status === 'REJECTED').length,
    COMPLETED: mockWithdrawals.filter((w) => w.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Withdrawal</h1>
          <p className="text-sm text-muted-foreground">
            Proses permintaan pencairan dana
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-warning" />
              <p className="text-xs text-warning font-medium">Total Pending</p>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(pendingTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">{statusCounts.PENDING} permintaan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Disetujui</p>
            <p className="text-xl font-bold text-primary-500 mt-1">{statusCounts.APPROVED}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Selesai</p>
            <p className="text-xl font-bold text-success mt-1">{statusCounts.COMPLETED}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ditolak</p>
            <p className="text-xl font-bold text-destructive mt-1">{statusCounts.REJECTED}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari user atau no rekening..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { key: 'PENDING', label: 'Pending' },
              { key: 'APPROVED', label: 'Disetujui' },
              { key: 'REJECTED', label: 'Ditolak' },
              { key: 'COMPLETED', label: 'Selesai' },
              { key: 'ALL', label: 'Semua' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts]})
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Bank/No.Rek</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data withdrawal
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWithdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-sm font-medium">{w.user}</TableCell>
                      <TableCell className="text-sm font-bold">{formatCurrency(w.amount)}</TableCell>
                      <TableCell className="text-sm">{w.method}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{w.bankName}</p>
                          <p className="text-xs text-muted-foreground">{w.accountNumber}</p>
                          <p className="text-xs text-muted-foreground">{w.accountHolder}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[w.status].className}>
                          {statusConfig[w.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(w.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        {w.status === 'PENDING' && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-success h-8 w-8 p-0"
                              onClick={() => setConfirmDialog({ open: true, type: 'approve', withdrawal: w })}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive h-8 w-8 p-0"
                              onClick={() => setConfirmDialog({ open: true, type: 'reject', withdrawal: w })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'approve' ? 'Setujui Withdrawal' : 'Tolak Withdrawal'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'approve'
                ? `Setujui pencairan ${formatCurrency(confirmDialog.withdrawal?.amount || 0)} ke ${confirmDialog.withdrawal?.bankName} - ${confirmDialog.withdrawal?.accountNumber} a.n ${confirmDialog.withdrawal?.accountHolder}?`
                : `Tolak permintaan pencairan dari ${confirmDialog.withdrawal?.user}? Dana akan dikembalikan ke saldo user.`}
            </DialogDescription>
          </DialogHeader>
          {confirmDialog.type === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan penolakan</label>
              <Input placeholder="Masukkan alasan..." />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
              Batal
            </Button>
            <Button
              variant={confirmDialog.type === 'approve' ? 'default' : 'destructive'}
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
              {confirmDialog.type === 'approve' ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
