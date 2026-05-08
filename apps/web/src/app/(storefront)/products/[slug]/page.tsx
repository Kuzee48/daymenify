'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  Star,
  ShoppingBag,
  Users,
  ShieldCheck,
  Zap,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { productService } from '@/services/product.service';
import { useCheckoutStore } from '@/store/checkout-store';
import { useFavoritesStore } from '@/store/favorites-store';
import { Breadcrumb } from '@/components/storefront/Breadcrumb';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/services/api.types';

// Determine input fields based on category
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { setProduct: setCheckoutProduct, setCustomerData, reset } = useCheckoutStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const res = await productService.getProductBySlug(slug);
      setProduct(res.data);

      if (res.data) {
        const relatedRes = await productService.getProducts({
          category: res.data.categorySlug,
          limit: 4,
        });
        setRelatedProducts(
          relatedRes.data.filter((p) => p.slug !== slug).slice(0, 4)
        );
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

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

  const handleBuyNow = () => {
    if (!product) return;

    const fields = getInputFields(product.categorySlug);
    const errors: Record<string, string> = {};

    fields.forEach((field) => {
      if (!formData[field.key]?.trim()) {
        errors[field.key] = `${field.label} wajib diisi`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Set checkout data
    reset();
    setCheckoutProduct(product);
    setCustomerData({
      userId: formData.userId,
      serverId: formData.serverId,
      phone: formData.phone,
    });

    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-4 w-64" />
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="mt-8 h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto flex flex-col items-center px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Produk Tidak Ditemukan
        </h2>
        <p className="mt-2 text-muted-foreground">
          Produk yang kamu cari tidak tersedia atau telah dihapus.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Lihat Semua Produk</Link>
        </Button>
      </div>
    );
  }

  const inputFields = getInputFields(product.categorySlug);
  const isFav = isFavorite(product.id);

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          { label: product.category, href: `/categories/${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      {/* Product Detail */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Left - Product Image/Info */}
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="flex aspect-square items-center justify-center p-8">
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                <ShoppingBag className="h-16 w-16 text-primary-600" />
              </div>
            </div>
            {product.discount && (
              <div className="absolute left-4 top-4">
                <Badge variant="destructive" className="text-sm font-bold">
                  -{product.discount}%
                </Badge>
              </div>
            )}
            <button
              onClick={() => toggleFavorite(product.id)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white"
            >
              <Heart
                className={cn(
                  'h-5 w-5',
                  isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'
                )}
              />
            </button>
          </div>

          {/* Product Info */}
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{product.category}</Badge>
              {product.isPopular && (
                <Badge variant="default" className="bg-accent-600">
                  Populer
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary-600">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Rating & Sold */}
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-gray-900">{product.rating}</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {product.sold.toLocaleString('id-ID')} terjual
              </span>
            </div>

            <Separator className="my-4" />

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900">Deskripsi</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Trust signals */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Proses Instan</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">100% Aman</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Order Form */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Form Pemesanan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Masukkan data akun kamu untuk melanjutkan pembelian
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

              <Separator className="my-6" />

              {/* Price Summary */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Produk</span>
                  <span className="text-sm font-medium">{product.name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Harga</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="mt-6 w-full text-base"
                onClick={handleBuyNow}
              >
                Beli Sekarang
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Produk Serupa</h2>
            <Link
              href={`/categories/${product.categorySlug}`}
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
