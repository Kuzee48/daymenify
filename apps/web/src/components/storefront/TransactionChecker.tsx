'use client';

import { useState } from 'react';
import { Search, FileText, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { transactionService } from '@/services/transaction.service';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/services/api.types';

const statusConfig = {
  pending: { label: 'Menunggu Pembayaran', icon: Clock, variant: 'warning' as const, color: 'text-yellow-600' },
  processing: { label: 'Diproses', icon: Loader2, variant: 'default' as const, color: 'text-blue-600' },
  completed: { label: 'Berhasil', icon: CheckCircle2, variant: 'success' as const, color: 'text-green-600' },
  failed: { label: 'Gagal', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600' },
  expired: { label: 'Kedaluwarsa', icon: XCircle, variant: 'secondary' as const, color: 'text-gray-600' },
};

export function TransactionChecker() {
  const [invoiceId, setInvoiceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Transaction | null>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);
    setHasSearched(true);

    const response = await transactionService.checkTransaction(invoiceId.trim());

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary-600" />
        <h3 className="text-sm font-semibold text-gray-900">Cek Status Transaksi</h3>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        Masukkan nomor invoice untuk melihat status transaksi kamu.
      </p>

      <form onSubmit={handleCheck} className="flex gap-2">
        <Input
          placeholder="Contoh: INV-20240115-001"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          className="text-sm"
        />
        <Button type="submit" size="sm" disabled={isLoading || !invoiceId.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="mr-1 h-3.5 w-3.5" />
              Cek
            </>
          )}
        </Button>
      </form>

      {/* Result */}
      {hasSearched && !isLoading && (
        <div className="mt-4">
          {result ? (
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{result.invoiceId}</span>
                <Badge variant={statusConfig[result.status].variant} className="text-[10px]">
                  {statusConfig[result.status].label}
                </Badge>
              </div>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {result.productName}
              </p>
              <p className="text-xs text-gray-600">
                {formatCurrency(result.amount)} • {result.paymentMethod}
              </p>
            </div>
          ) : error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
