'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, FileText, ExternalLink } from 'lucide-react';

import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { Transaction } from '@/services/api.types';

// Mock data
const mockTransactions: Transaction[] = [
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
  {
    id: '6',
    invoiceId: 'INV-20240110-006',
    productId: 'p6',
    productName: 'PUBG Mobile - 60 UC',
    customerData: { userId: '5432167890' },
    amount: 16000,
    paymentMethod: 'ShopeePay',
    status: 'completed',
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-01-10T08:31:00Z',
  },
  {
    id: '7',
    invoiceId: 'INV-20240109-007',
    productId: 'p7',
    productName: 'Token PLN 100.000',
    customerData: { phone: '08198765432' },
    amount: 100000,
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    createdAt: '2024-01-09T12:00:00Z',
    updatedAt: '2024-01-09T12:01:00Z',
  },
  {
    id: '8',
    invoiceId: 'INV-20240108-008',
    productId: 'p8',
    productName: 'Voucher Google Play 50K',
    customerData: { userId: 'user@email.com' },
    amount: 50000,
    paymentMethod: 'QRIS',
    status: 'expired',
    createdAt: '2024-01-08T18:15:00Z',
    updatedAt: '2024-01-08T19:15:00Z',
  },
  {
    id: '9',
    invoiceId: 'INV-20240107-009',
    productId: 'p9',
    productName: 'Mobile Legends - 172 Diamonds',
    customerData: { userId: '111222', serverId: '3344' },
    amount: 42000,
    paymentMethod: 'GoPay',
    status: 'completed',
    createdAt: '2024-01-07T11:30:00Z',
    updatedAt: '2024-01-07T11:31:00Z',
  },
  {
    id: '10',
    invoiceId: 'INV-20240106-010',
    productId: 'p10',
    productName: 'Paket Data XL 10GB',
    customerData: { phone: '08170001234' },
    amount: 65000,
    paymentMethod: 'OVO',
    status: 'completed',
    createdAt: '2024-01-06T15:45:00Z',
    updatedAt: '2024-01-06T15:46:00Z',
  },
];

const statusConfig: Record<
  Transaction['status'],
  { label: string; className: string }
> = {
  completed: { label: 'Berhasil', className: 'bg-success/10 text-success border-success/20' },
  failed: { label: 'Gagal', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  pending: { label: 'Menunggu', className: 'bg-warning/10 text-warning border-warning/20' },
  processing: { label: 'Diproses', className: 'bg-primary-100 text-primary-700 border-primary-200' },
  expired: { label: 'Kedaluwarsa', className: 'bg-muted text-muted-foreground border-border' },
};

const ITEMS_PER_PAGE = 5;

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTransactions = useMemo(() => {
    let result = mockTransactions;

    // Filter by status tab
    if (activeTab !== 'all') {
      const statusMap: Record<string, Transaction['status'][]> = {
        success: ['completed'],
        failed: ['failed', 'expired'],
        pending: ['pending', 'processing'],
      };
      result = result.filter((tx) => statusMap[activeTab]?.includes(tx.status));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.invoiceId.toLowerCase().includes(query) ||
          tx.productName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Riwayat Transaksi</h2>
        <p className="text-muted-foreground">
          Lihat dan kelola semua transaksi kamu.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari invoice ID atau produk..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Tabs & Table */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="success">Berhasil</TabsTrigger>
          <TabsTrigger value="failed">Gagal</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {paginatedTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Nominal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((tx) => {
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
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(tx.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <Link href={`/dashboard/transactions/${tx.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">
                    Tidak ada transaksi
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Tidak ditemukan transaksi yang sesuai.'
                      : 'Kamu belum memiliki transaksi.'}
                  </p>
                  {!searchQuery && (
                    <Button className="mt-4" asChild>
                      <Link href="/products">Mulai Belanja</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}{' '}
                dari {filteredTransactions.length} transaksi
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
