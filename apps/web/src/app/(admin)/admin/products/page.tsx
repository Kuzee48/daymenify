'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Power,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
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
} from '@/components/ui';

type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

interface MockProduct {
  id: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  status: ProductStatus;
  sold: number;
  image: string;
}

const mockProducts: MockProduct[] = [
  { id: '1', name: 'Mobile Legends 86 Diamonds', category: 'Game', buyPrice: 18500, sellPrice: 22000, status: 'ACTIVE', sold: 1284, image: '🎮' },
  { id: '2', name: 'Free Fire 720 Diamonds', category: 'Game', buyPrice: 125000, sellPrice: 145000, status: 'ACTIVE', sold: 856, image: '🎮' },
  { id: '3', name: 'Telkomsel 50.000', category: 'Pulsa', buyPrice: 48500, sellPrice: 50500, status: 'ACTIVE', sold: 743, image: '📱' },
  { id: '4', name: 'PUBG Mobile 660 UC', category: 'Game', buyPrice: 139000, sellPrice: 159000, status: 'ACTIVE', sold: 521, image: '🎮' },
  { id: '5', name: 'Genshin Impact 330 Genesis', category: 'Game', buyPrice: 72000, sellPrice: 81000, status: 'ACTIVE', sold: 412, image: '🎮' },
  { id: '6', name: 'XL 25.000', category: 'Pulsa', buyPrice: 24200, sellPrice: 25500, status: 'ACTIVE', sold: 389, image: '📱' },
  { id: '7', name: 'Indosat 100.000', category: 'Pulsa', buyPrice: 97000, sellPrice: 101000, status: 'OUT_OF_STOCK', sold: 267, image: '📱' },
  { id: '8', name: 'PLN Token 100.000', category: 'PLN', buyPrice: 98500, sellPrice: 102000, status: 'ACTIVE', sold: 198, image: '⚡' },
  { id: '9', name: 'Netflix Premium 1 Bulan', category: 'Voucher', buyPrice: 145000, sellPrice: 165000, status: 'INACTIVE', sold: 156, image: '🎬' },
  { id: '10', name: 'Spotify Premium 1 Bulan', category: 'Voucher', buyPrice: 42000, sellPrice: 55000, status: 'ACTIVE', sold: 134, image: '🎵' },
];

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Aktif', className: 'bg-success/10 text-success border-success/20' },
  INACTIVE: { label: 'Nonaktif', className: 'bg-muted text-muted-foreground' },
  OUT_OF_STOCK: { label: 'Habis', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const categories = ['Semua', 'Game', 'Pulsa', 'PLN', 'Voucher'];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selected, setSelected] = useState<string[]>([]);

  const filteredProducts = mockProducts.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'Semua' || product.category === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || product.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === filteredProducts.length) {
      setSelected([]);
    } else {
      setSelected(filteredProducts.map((p) => p.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Produk</h1>
          <p className="text-sm text-muted-foreground">
            Kelola katalog produk digital ({mockProducts.length} produk)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Provider
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
              <option value="OUT_OF_STOCK">Habis</option>
            </select>
          </div>
          {selected.length > 0 && (
            <div className="mt-3 flex items-center gap-2 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{selected.length} dipilih</span>
              <Button size="sm" variant="outline" className="text-success">
                <Power className="h-3 w-3 mr-1" />
                Aktifkan
              </Button>
              <Button size="sm" variant="outline" className="text-destructive">
                <Power className="h-3 w-3 mr-1" />
                Nonaktifkan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleAll}
                      className="rounded border-border"
                    />
                  </TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga Beli</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terjual</TableHead>
                  <TableHead className="w-10">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada produk ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="rounded border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{product.image}</span>
                          <span className="text-sm font-medium text-foreground">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatCurrency(product.buyPrice)}</TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(product.sellPrice)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[product.status].className}>
                          {statusConfig[product.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{product.sold}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Produk
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

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredProducts.length} dari {mockProducts.length} produk
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
    </div>
  );
}
