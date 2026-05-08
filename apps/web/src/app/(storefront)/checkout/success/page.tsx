'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Receipt, Home } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { useCheckoutStore } from '@/store/checkout-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice') || 'INV-XXXXXX';
  const { selectedProduct, customerData, selectedPaymentMethod, reset } = useCheckoutStore();

  useEffect(() => {
    // Reset checkout state after displaying
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <div className="container mx-auto flex flex-col items-center px-4 py-12">
      {/* Success Icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      <h1 className="mt-6 text-2xl font-bold text-gray-900">
        Pesanan Berhasil Dibuat!
      </h1>
      <p className="mt-2 text-center text-muted-foreground">
        Pesanan kamu sedang diproses. Silakan lakukan pembayaran sesuai metode yang dipilih.
      </p>

      {/* Invoice ID */}
      <div className="mt-6 rounded-lg bg-primary-50 px-6 py-3">
        <p className="text-sm text-primary-700">Invoice ID</p>
        <p className="text-lg font-bold text-primary-900">{invoiceId}</p>
      </div>

      {/* Order Summary Card */}
      <Card className="mt-8 w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900">Ringkasan Pesanan</h2>
          <Separator className="my-4" />

          <div className="space-y-3">
            {selectedProduct && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Produk</span>
                <span className="font-medium text-right max-w-[60%] truncate">
                  {selectedProduct.name}
                </span>
              </div>
            )}

            {customerData.userId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-medium">{customerData.userId}</span>
              </div>
            )}

            {customerData.serverId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Server ID</span>
                <span className="font-medium">{customerData.serverId}</span>
              </div>
            )}

            {customerData.phone && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nomor</span>
                <span className="font-medium">{customerData.phone}</span>
              </div>
            )}

            {selectedPaymentMethod && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pembayaran</span>
                <span className="font-medium uppercase">{selectedPaymentMethod}</span>
              </div>
            )}

            {selectedProduct && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(selectedProduct.price)}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="mt-8 flex w-full max-w-md flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href={`/transactions/${invoiceId}`}>
            <Receipt className="mr-2 h-4 w-4" />
            Cek Status Transaksi
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Kembali ke Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
