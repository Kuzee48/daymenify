'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  Ticket,
  Copy,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Separator,
} from '@/components/ui';

type VoucherType = 'PERCENTAGE' | 'FIXED';
type VoucherStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

interface MockVoucher {
  id: string;
  code: string;
  name: string;
  type: VoucherType;
  value: number;
  minPurchase: number;
  usage: number;
  maxUsage: number;
  status: VoucherStatus;
  startDate: string;
  endDate: string;
}

const mockVouchers: MockVoucher[] = [
  { id: '1', code: 'NEWYEAR2024', name: 'Promo Tahun Baru', type: 'PERCENTAGE', value: 10, minPurchase: 50000, usage: 234, maxUsage: 500, status: 'ACTIVE', startDate: '2024-01-01', endDate: '2024-01-31' },
  { id: '2', code: 'WELCOME50', name: 'Welcome Bonus', type: 'FIXED', value: 5000, minPurchase: 25000, usage: 1089, maxUsage: 0, status: 'ACTIVE', startDate: '2024-01-01', endDate: '2024-12-31' },
  { id: '3', code: 'FLASH15', name: 'Flash Sale 15%', type: 'PERCENTAGE', value: 15, minPurchase: 100000, usage: 89, maxUsage: 100, status: 'ACTIVE', startDate: '2024-01-10', endDate: '2024-01-20' },
  { id: '4', code: 'RESELLER20', name: 'Diskon Reseller', type: 'PERCENTAGE', value: 20, minPurchase: 200000, usage: 45, maxUsage: 200, status: 'ACTIVE', startDate: '2024-01-01', endDate: '2024-06-30' },
  { id: '5', code: 'XMAS2023', name: 'Promo Natal', type: 'FIXED', value: 10000, minPurchase: 50000, usage: 500, maxUsage: 500, status: 'EXPIRED', startDate: '2023-12-20', endDate: '2023-12-31' },
  { id: '6', code: 'SPECIAL100', name: 'Voucher Spesial', type: 'FIXED', value: 100000, minPurchase: 500000, usage: 0, maxUsage: 10, status: 'INACTIVE', startDate: '2024-02-01', endDate: '2024-02-14' },
];

const statusConfig: Record<VoucherStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Aktif', className: 'bg-success/10 text-success border-success/20' },
  INACTIVE: { label: 'Nonaktif', className: 'bg-muted text-muted-foreground' },
  EXPIRED: { label: 'Kadaluarsa', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function VouchersPage() {
  const [search, setSearch] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'PERCENTAGE' as VoucherType,
    value: '',
    minPurchase: '',
    maxUsage: '',
    startDate: '',
    endDate: '',
  });

  const filteredVouchers = mockVouchers.filter(
    (v) =>
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Voucher</h1>
          <p className="text-sm text-muted-foreground">
            Buat dan kelola kode voucher diskon
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Voucher
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Voucher Aktif</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {mockVouchers.filter((v) => v.status === 'ACTIVE').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Penggunaan</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {mockVouchers.reduce((sum, v) => sum + v.usage, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Kadaluarsa</p>
            <p className="text-xl font-bold text-destructive mt-1">
              {mockVouchers.filter((v) => v.status === 'EXPIRED').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Nonaktif</p>
            <p className="text-xl font-bold text-muted-foreground mt-1">
              {mockVouchers.filter((v) => v.status === 'INACTIVE').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari kode atau nama voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Min. Pembelian</TableHead>
                  <TableHead>Penggunaan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada voucher ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-bold">
                            {voucher.code}
                          </code>
                          <button className="text-muted-foreground hover:text-foreground">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{voucher.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {voucher.type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {voucher.type === 'PERCENTAGE' ? `${voucher.value}%` : formatCurrency(voucher.value)}
                      </TableCell>
                      <TableCell className="text-sm">{formatCurrency(voucher.minPurchase)}</TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{voucher.usage}</span>
                        {voucher.maxUsage > 0 && (
                          <span className="text-muted-foreground">/{voucher.maxUsage}</span>
                        )}
                        {voucher.maxUsage === 0 && (
                          <span className="text-muted-foreground"> (unlimited)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[voucher.status].className}>
                          {statusConfig[voucher.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Power className="h-4 w-4 mr-2" />
                              {voucher.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Voucher Baru</DialogTitle>
            <DialogDescription>
              Isi detail voucher untuk membuat kode diskon baru
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Kode Voucher</label>
              <Input
                placeholder="Contoh: PROMO2024"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama</label>
              <Input
                placeholder="Nama promo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as VoucherType })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Nominal (Rp)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nilai</label>
                <Input
                  type="number"
                  placeholder={formData.type === 'PERCENTAGE' ? '10' : '5000'}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Min. Pembelian</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Penggunaan</label>
                <Input
                  type="number"
                  placeholder="0 = unlimited"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Mulai</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Berakhir</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => setCreateDialog(false)}>
              Buat Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
