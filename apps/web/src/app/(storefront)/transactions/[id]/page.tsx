'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  CreditCard,
  CheckCircle2,
  Package,
  AlertCircle,
  HelpCircle,
  Copy,
  ArrowLeft,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Mock transaction data
const mockTransaction = {
  id: 'txn-001',
  invoiceId: 'INV-LX8K2MN',
  productId: '1',
  productName: '86 Diamonds Mobile Legends',
  customerData: {
    userId: '123456789',
    serverId: '8012',
  },
  amount: 19000,
  fee: 0,
  total: 19000,
  paymentMethod: 'QRIS',
  status: 'processing' as const,
  serialNumber: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

const statusConfig: Record<
  TransactionStatus,
  { label: string; color: string; badgeVariant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }
> = {
  pending: { label: 'Menunggu Pembayaran', color: 'text-amber-600', badgeVariant: 'warning' },
  processing: { label: 'Sedang Diproses', color: 'text-blue-600', badgeVariant: 'default' },
  completed: { label: 'Selesai', color: 'text-green-600', badgeVariant: 'success' },
  failed: { label: 'Gagal', color: 'text-red-600', badgeVariant: 'destructive' },
  expired: { label: 'Kedaluwarsa', color: 'text-gray-500', badgeVariant: 'secondary' },
};

const timelineSteps = [
  { key: 'pending', label: 'Dibuat', icon: Clock },
  { key: 'paid', label: 'Dibayar', icon: CreditCard },
  { key: 'processing', label: 'Diproses', icon: Package },
  { key: 'completed', label: 'Selesai', icon: CheckCircle2 },
];

function getTimelineStatus(status: TransactionStatus) {
  switch (status) {
    case 'pending':
      return 0;
    case 'processing':
      return 2;
    case 'completed':
      return 3;
    case 'failed':
    case 'expired':
      return -1;
    default:
      return 0;
  }
}

export default function TransactionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // In a real app, we would fetch the transaction by ID
  const transaction = { ...mockTransaction, invoiceId: id || mockTransaction.invoiceId };
  const config = statusConfig[transaction.status];
  const activeStep = getTimelineStatus(transaction.status);

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(transaction.invoiceId);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          { label: 'Transaksi', href: '/dashboard' },
          { label: transaction.invoiceId },
        ]}
      />

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mt-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Detail Transaksi
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {transaction.invoiceId}
              </span>
              <button
                onClick={handleCopyInvoice}
                className="text-muted-foreground hover:text-foreground"
                title="Salin Invoice ID"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Badge variant={config.badgeVariant}>{config.label}</Badge>
        </div>

        {/* Status Timeline */}
        {activeStep >= 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h2 className="mb-6 text-sm font-semibold text-gray-900">
                Status Pesanan
              </h2>
              <div className="flex items-center justify-between">
                {timelineSteps.map((stepItem, index) => {
                  const Icon = stepItem.icon;
                  const isCompleted = index <= activeStep;
                  const isActive = index === activeStep;
                  const isLast = index === timelineSteps.length - 1;

                  return (
                    <div key={stepItem.key} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                            isCompleted
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-400',
                            isActive && 'ring-4 ring-primary-100'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span
                          className={cn(
                            'mt-2 text-xs font-medium',
                            isCompleted ? 'text-primary-600' : 'text-gray-400'
                          )}
                        >
                          {stepItem.label}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className={cn(
                            'mx-1 h-0.5 flex-1 sm:mx-2',
                            index < activeStep ? 'bg-primary-600' : 'bg-gray-200'
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed/Expired State */}
        {activeStep < 0 && (
          <Card className="mt-6 border-red-100">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">
                  Transaksi {transaction.status === 'failed' ? 'Gagal' : 'Kedaluwarsa'}
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {transaction.status === 'failed'
                    ? 'Terjadi kesalahan saat memproses transaksi. Silakan coba lagi.'
                    : 'Waktu pembayaran telah habis. Silakan buat pesanan baru.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Details */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Detail Pesanan
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Invoice ID</span>
                <span className="font-medium">{transaction.invoiceId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-medium">
                  {formatDate(transaction.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Produk</span>
                <span className="font-medium">{transaction.productName}</span>
              </div>
              {transaction.customerData.userId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-medium">
                    {transaction.customerData.userId}
                  </span>
                </div>
              )}
              {transaction.customerData.serverId && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Server ID</span>
                  <span className="font-medium">
                    {transaction.customerData.serverId}
                  </span>
                </div>
              )}
              {transaction.customerData.phone && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Nomor</span>
                  <span className="font-medium">
                    {transaction.customerData.phone}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Metode Pembayaran</span>
                <span className="font-medium">{transaction.paymentMethod}</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Pricing Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(transaction.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Biaya Layanan</span>
                <span>{transaction.fee === 0 ? 'Gratis' : formatCurrency(transaction.fee)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(transaction.total)}
                </span>
              </div>
            </div>

            {/* Serial Number (if completed) */}
            {transaction.status === 'completed' && transaction.serialNumber && (
              <>
                <Separator className="my-4" />
                <div className="rounded-lg bg-green-50 p-4">
                  <h3 className="text-sm font-medium text-green-800">
                    Serial Number / Voucher Code
                  </h3>
                  <p className="mt-1 font-mono text-lg font-bold text-green-900">
                    {transaction.serialNumber}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/help">
              <HelpCircle className="mr-2 h-4 w-4" />
              Butuh Bantuan?
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
