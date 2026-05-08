'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  CreditCard,
  QrCode,
  Wallet,
  Building2,
  Store,
  ChevronRight,
  ChevronLeft,
  Tag,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useCheckoutStore } from '@/store/checkout-store';
import { StepIndicator } from '@/components/storefront/StepIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const checkoutSteps = [
  { number: 1, label: 'Produk' },
  { number: 2, label: 'Data' },
  { number: 3, label: 'Pembayaran' },
  { number: 4, label: 'Konfirmasi' },
];

const paymentMethods = [
  { id: 'qris', name: 'QRIS', icon: QrCode, fee: 0, category: 'E-Wallet' },
  { id: 'gopay', name: 'GoPay', icon: Wallet, fee: 0, category: 'E-Wallet' },
  { id: 'ovo', name: 'OVO', icon: Wallet, fee: 0, category: 'E-Wallet' },
  { id: 'dana', name: 'DANA', icon: Wallet, fee: 0, category: 'E-Wallet' },
  { id: 'bca-va', name: 'BCA VA', icon: Building2, fee: 2500, category: 'Virtual Account' },
  { id: 'mandiri-va', name: 'Mandiri VA', icon: Building2, fee: 2500, category: 'Virtual Account' },
  { id: 'bri-va', name: 'BRI VA', icon: Building2, fee: 2500, category: 'Virtual Account' },
  { id: 'alfamart', name: 'Alfamart', icon: Store, fee: 2500, category: 'Gerai' },
];

function getInputFields(categorySlug: string) {
  switch (categorySlug) {
    case 'game-top-up':
      return [
        { key: 'userId', label: 'User ID', placeholder: 'Masukkan User ID', type: 'text' },
        { key: 'serverId', label: 'Server ID', placeholder: 'Masukkan Server ID', type: 'text' },
      ];
    case 'pulsa-data':
      return [
        { key: 'phone', label: 'Nomor HP', placeholder: 'Contoh: 08123456789', type: 'tel' },
      ];
    case 'token-listrik':
      return [
        { key: 'phone', label: 'Nomor Meter / ID Pelanggan', placeholder: 'Masukkan nomor meter PLN', type: 'text' },
      ];
    case 'e-wallet':
      return [
        { key: 'phone', label: 'Nomor HP', placeholder: 'Contoh: 08123456789', type: 'tel' },
      ];
    default:
      return [
        { key: 'userId', label: 'ID Akun', placeholder: 'Masukkan ID akun kamu', type: 'text' },
      ];
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    selectedProduct,
    customerData,
    selectedPaymentMethod,
    voucherCode,
    step,
    setCustomerData,
    setPaymentMethod,
    setVoucher,
    nextStep,
    prevStep,
  } = useCheckoutStore();

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedProduct) {
      router.push('/');
    }
  }, [selectedProduct, router]);

  useEffect(() => {
    // Pre-fill from existing customer data
    setFormData({
      userId: customerData.userId || '',
      serverId: customerData.serverId || '',
      phone: customerData.phone || '',
    });
  }, [customerData]);

  if (!selectedProduct) {
    return null;
  }

  const inputFields = getInputFields(selectedProduct.categorySlug);
  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);
  const fee = selectedMethod?.fee || 0;
  const subtotal = selectedProduct.price;
  const discount = 0; // Could be applied via voucher
  const total = subtotal + fee - discount;

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleNextStep = () => {
    if (step === 2) {
      // Validate customer data
      const errors: Record<string, string> = {};
      inputFields.forEach((field) => {
        if (!formData[field.key]?.trim()) {
          errors[field.key] = `${field.label} wajib diisi`;
        }
      });
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setCustomerData({
        userId: formData.userId || undefined,
        serverId: formData.serverId || undefined,
        phone: formData.phone || undefined,
      });
    }

    if (step === 3 && !selectedPaymentMethod) {
      return; // Must select payment method
    }

    nextStep();
  };

  const handlePayNow = () => {
    // Navigate to success page with a mock invoice ID
    const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
    router.push(`/checkout/success?invoice=${invoiceId}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Step Indicator */}
      <StepIndicator steps={checkoutSteps} currentStep={step} className="mb-8" />

      <div className="mx-auto max-w-2xl">
        {/* Step 1: Product Summary */}
        {step === 1 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Ringkasan Produk
              </h2>
              <div className="mt-4 flex items-start gap-4 rounded-lg bg-gray-50 p-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100">
                  <ShoppingBag className="h-7 w-7 text-primary-600" />
                </div>
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-1 text-[10px]">
                    {selectedProduct.category}
                  </Badge>
                  <h3 className="font-medium text-gray-900">
                    {selectedProduct.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedProduct.description}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Harga</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(selectedProduct.price)}
                  </span>
                  {selectedProduct.originalPrice && (
                    <span className="ml-2 text-sm text-gray-400 line-through">
                      {formatCurrency(selectedProduct.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Customer Data */}
        {step === 2 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Data Pelanggan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Masukkan data akun yang akan diproses
              </p>
              <div className="mt-6 space-y-4">
                {inputFields.map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    placeholder={field.placeholder}
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    error={formErrors[field.key]}
                  />
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 p-3">
                <p className="text-xs text-amber-700">
                  Pastikan data yang kamu masukkan sudah benar. Kesalahan input bukan tanggung jawab kami.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment Method */}
        {step === 3 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Metode Pembayaran
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pilih metode pembayaran yang kamu inginkan
              </p>

              {/* Group by category */}
              {['E-Wallet', 'Virtual Account', 'Gerai'].map((category) => {
                const methods = paymentMethods.filter(
                  (m) => m.category === category
                );
                return (
                  <div key={category} className="mt-6">
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      {category}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {methods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedPaymentMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={cn(
                              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-6 w-6',
                                isSelected ? 'text-primary-600' : 'text-gray-500'
                              )}
                            />
                            <span
                              className={cn(
                                'text-sm font-medium',
                                isSelected ? 'text-primary-600' : 'text-gray-700'
                              )}
                            >
                              {method.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {method.fee === 0 ? 'Gratis' : `+${formatCurrency(method.fee)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {!selectedPaymentMethod && (
                <p className="mt-4 text-center text-sm text-amber-600">
                  Pilih metode pembayaran untuk melanjutkan
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Konfirmasi Pesanan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Periksa kembali detail pesanan kamu
              </p>

              {/* Order Summary */}
              <div className="mt-6 space-y-4">
                {/* Product */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Produk
                  </h3>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedProduct.name}
                  </p>
                </div>

                {/* Customer Data */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Data Pelanggan
                  </h3>
                  <div className="mt-1 space-y-1">
                    {customerData.userId && (
                      <p className="text-sm">User ID: <span className="font-medium">{customerData.userId}</span></p>
                    )}
                    {customerData.serverId && (
                      <p className="text-sm">Server ID: <span className="font-medium">{customerData.serverId}</span></p>
                    )}
                    {customerData.phone && (
                      <p className="text-sm">Nomor: <span className="font-medium">{customerData.phone}</span></p>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Metode Pembayaran
                  </h3>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedMethod?.name || '-'}
                  </p>
                </div>

                {/* Voucher Code */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Kode Voucher (opsional)"
                      value={voucherCode}
                      onChange={(e) => setVoucher(e.target.value.toUpperCase())}
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <Button variant="outline" size="default">
                    Terapkan
                  </Button>
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Biaya Layanan</span>
                    <span>{fee === 0 ? 'Gratis' : formatCurrency(fee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600">
                      <span>Diskon</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-primary-600">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="mt-6 w-full text-base"
                onClick={handlePayNow}
              >
                Bayar Sekarang
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Kembali
            </Button>
          ) : (
            <div />
          )}
          {step < 4 && (
            <Button
              onClick={handleNextStep}
              disabled={step === 3 && !selectedPaymentMethod}
            >
              Lanjutkan
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
