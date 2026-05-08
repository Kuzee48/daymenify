'use client';

import { useState } from 'react';
import {
  Search,
  Download,
  Eye,
  RefreshCw,
  RotateCcw,
  Calendar,
  Filter,
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui';

type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'PROCESSING';

interface MockTransaction {
  id: string;
  invoice: string;
  user: string;
  product: string;
  amount: number;
  gateway: string;
  status: TransactionStatus;
  provider: string;
  date: string;
}

const mockTransactions: MockTransaction[] = [
  { id: '1', invoice: 'INV-20240115-001', user: 'Ahmad Rizki', product: 'ML 86 Diamonds', amount: 22000, gateway: 'Tripay', status: 'SUCCESS', provider: 'Digiflazz', date: '2024-01-15T10:30:00' },
  { id: '2', invoice: 'INV-20240115-002', user: 'Siti Nurhaliza', product: 'FF 720 Diamonds', amount: 145000, gateway: 'Midtrans', status: 'PENDING', provider: 'Digiflazz', date: '2024-01-15T10:25:00' },
  { id: '3', invoice: 'INV-20240115-003', user: 'Budi Santoso', product: 'Telkomsel 50rb', amount: 50500, gateway: 'Xendit', status: 'SUCCESS', provider: 'VIP-Reseller', date: '2024-01-15T10:20:00' },
  { id: '4', invoice: 'INV-20240115-004', user: 'Dewi Lestari', product: 'PUBG 660 UC', amount: 159000, gateway: 'Duitku', status: 'FAILED', provider: 'Tokovoucher', date: '2024-01-15T10:15:00' },
  { id: '5', invoice: 'INV-20240115-005', user: 'Rendra Wijaya', product: 'XL 25rb', amount: 25500, gateway: 'Tripay', status: 'SUCCESS', provider: 'Digiflazz', date: '2024-01-15T10:10:00' },
  { id: '6', invoice: 'INV-20240115-006', user: 'Putri Anggraini', product: 'PLN 100rb', amount: 102000, gateway: 'Bayar.gg', status: 'PROCESSING', provider: 'VIP-Reseller', date: '2024-01-15T10:05:00' },
  { id: '7', invoice: 'INV-20240115-007', user: 'Hendra Gunawan', product: 'Genshin 330 Genesis', amount: 81000, gateway: 'Pakasir', status: 'SUCCESS', provider: 'Digiflazz', date: '2024-01-15T09:55:00' },
  { id: '8', invoice: 'INV-20240115-008', user: 'Fitri Rahmawati', product: 'Indosat 100rb', amount: 101000, gateway: 'Midtrans', status: 'FAILED', provider: 'Tokovoucher', date: '2024-01-15T09:50:00' },
  { id: '9', invoice: 'INV-20240115-009', user: 'Dimas Prasetyo', product: 'Netflix 1 Bulan', amount: 165000, gateway: 'Xendit', status: 'SUCCESS', provider: 'Digiflazz', date: '2024-01-15T09:45:00' },
  { id: '10', invoice: 'INV-20240115-010', user: 'Anisa Fitriani', product: 'Spotify 1 Bulan', amount: 55000, gateway: 'Tripay', status: 'SUCCESS', provider: 'VIP-Reseller', date: '2024-01-15T09:40:00' },
  { id: '11', invoice: 'INV-20240115-011', user: 'Yoga Pratama', product: 'ML 172 Diamonds', amount: 43000, gateway: 'Duitku', status: 'PENDING', provider: 'Digiflazz', date: '2024-01-15T09:35:00' },
  { id: '12', invoice: 'INV-20240115-012', user: 'Rina Susanti', product: 'Telkomsel 100rb', amount: 101000, gateway: 'Bayar.gg', status: 'SUCCESS', provider: 'VIP-Reseller', date: '2024-01-15T09:30:00' },
];

const statusConfig: Record<TransactionStatus, { label: string; className: string }> = {
  SUCCESS: { label: 'Sukses', className: 'bg-success/10 text-success border-success/20' },
  FAILED: { label: 'Gagal', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  PENDING: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  PROCESSING: { label: 'Proses', className: 'bg-primary-500/10 text-primary-500 border-primary-500/20' },
};

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedTx, setSelectedTx] = useState<MockTransaction | null>(null);

  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchSearch = tx.invoice.toLowerCase().includes(search.toLowerCase()) ||
      tx.user.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'ALL' || tx.status === activeTab;
    return matchSearch && matchTab;
  });

  const statusCounts = {
    ALL: mockTransactions.length,
    SUCCESS: mockTransactions.filter((t) => t.status === 'SUCCESS').length,
    FAILED: mockTransactions.filter((t) => t.status === 'FAILED').length,
    PENDING: mockTransactions.filter((t) => t.status === 'PENDING').length,
    PROCESSING: mockTransactions.filter((t) => t.status === 'PROCESSING').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Transaksi</h1>
          <p className="text-sm text-muted-foreground">
            Monitor dan kelola semua transaksi
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Hari Ini</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(1050000)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Transaksi Sukses</p>
            <p className="text-xl font-bold text-success mt-1">{statusCounts.SUCCESS}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Transaksi Gagal</p>
            <p className="text-xl font-bold text-destructive mt-1">{statusCounts.FAILED}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Menunggu</p>
            <p className="text-xl font-bold text-warning mt-1">{statusCounts.PENDING + statusCounts.PROCESSING}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari invoice atau user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" className="w-auto text-sm" />
              <span className="text-muted-foreground text-sm">—</span>
              <Input type="date" className="w-auto text-sm" />
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'ALL', label: 'Semua' },
              { key: 'SUCCESS', label: 'Sukses' },
              { key: 'FAILED', label: 'Gagal' },
              { key: 'PENDING', label: 'Pending' },
              { key: 'PROCESSING', label: 'Proses' },
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="w-10">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Tidak ada transaksi ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">{tx.invoice}</TableCell>
                      <TableCell className="text-sm">{tx.user}</TableCell>
                      <TableCell className="text-sm">{tx.product}</TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell className="text-xs">{tx.gateway}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[tx.status].className}>
                          {statusConfig[tx.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tx.provider}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedTx(tx);
                              setDetailDialog(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            {tx.status === 'FAILED' && (
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                              </DropdownMenuItem>
                            )}
                            {tx.status === 'SUCCESS' && (
                              <DropdownMenuItem className="text-destructive">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredTransactions.length} dari {mockTransactions.length} transaksi
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled>
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
            <DialogDescription>
              {selectedTx?.invoice}
            </DialogDescription>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedTx.user}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Produk</p>
                  <p className="font-medium">{selectedTx.product}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nominal</p>
                  <p className="font-medium">{formatCurrency(selectedTx.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gateway</p>
                  <p className="font-medium">{selectedTx.gateway}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <p className="font-medium">{selectedTx.provider}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusConfig[selectedTx.status].className}>
                    {statusConfig[selectedTx.status].label}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{formatDate(selectedTx.date)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
