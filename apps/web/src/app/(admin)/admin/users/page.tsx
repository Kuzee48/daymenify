'use client';

import { useState } from 'react';
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Shield,
  Ban,
  Eye,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  DialogTrigger,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Skeleton,
} from '@/components/ui';

type UserStatus = 'ACTIVE' | 'BANNED' | 'SUSPENDED';
type UserRole = 'USER' | 'RESELLER' | 'ADMIN';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  balance: number;
  createdAt: string;
  avatar: string;
}

const mockUsers: MockUser[] = [
  { id: '1', name: 'Ahmad Rizki Pratama', email: 'ahmad.rizki@gmail.com', role: 'USER', status: 'ACTIVE', balance: 125000, createdAt: '2024-01-15', avatar: 'AR' },
  { id: '2', name: 'Siti Nurhaliza', email: 'siti.nur@yahoo.com', role: 'RESELLER', status: 'ACTIVE', balance: 2500000, createdAt: '2024-01-12', avatar: 'SN' },
  { id: '3', name: 'Budi Santoso', email: 'budi.s@gmail.com', role: 'USER', status: 'BANNED', balance: 0, createdAt: '2024-01-10', avatar: 'BS' },
  { id: '4', name: 'Dewi Lestari', email: 'dewi.lestari@outlook.com', role: 'USER', status: 'ACTIVE', balance: 45000, createdAt: '2024-01-08', avatar: 'DL' },
  { id: '5', name: 'Rendra Wijaya', email: 'rendra.w@gmail.com', role: 'RESELLER', status: 'ACTIVE', balance: 8750000, createdAt: '2024-01-05', avatar: 'RW' },
  { id: '6', name: 'Putri Anggraini', email: 'putri.a@gmail.com', role: 'USER', status: 'SUSPENDED', balance: 15000, createdAt: '2024-01-03', avatar: 'PA' },
  { id: '7', name: 'Hendra Gunawan', email: 'hendra.g@yahoo.com', role: 'USER', status: 'ACTIVE', balance: 320000, createdAt: '2023-12-28', avatar: 'HG' },
  { id: '8', name: 'Fitri Rahmawati', email: 'fitri.r@gmail.com', role: 'ADMIN', status: 'ACTIVE', balance: 0, createdAt: '2023-12-20', avatar: 'FR' },
  { id: '9', name: 'Dimas Prasetyo', email: 'dimas.p@outlook.com', role: 'USER', status: 'ACTIVE', balance: 89000, createdAt: '2023-12-15', avatar: 'DP' },
  { id: '10', name: 'Anisa Fitriani', email: 'anisa.f@gmail.com', role: 'RESELLER', status: 'ACTIVE', balance: 4200000, createdAt: '2023-12-10', avatar: 'AF' },
];

const statusConfig: Record<UserStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Aktif', className: 'bg-success/10 text-success border-success/20' },
  BANNED: { label: 'Banned', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  SUSPENDED: { label: 'Suspended', className: 'bg-warning/10 text-warning border-warning/20' },
};

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  USER: { label: 'User', className: 'bg-muted text-muted-foreground' },
  RESELLER: { label: 'Reseller', className: 'bg-primary-500/10 text-primary-500 border-primary-500/20' },
  ADMIN: { label: 'Admin', className: 'bg-accent-500/10 text-accent-500 border-accent-500/20' },
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);

  const filteredUsers = mockUsers.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen User</h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengguna platform ({mockUsers.length} total)
          </p>
        </div>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">Semua Role</option>
              <option value="USER">User</option>
              <option value="RESELLER">Reseller</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="BANNED">Banned</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
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
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Terdaftar</TableHead>
                  <TableHead className="w-10">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada user ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-500">{user.avatar}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleConfig[user.role].className}>
                          {roleConfig[user.role].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[user.status].className}>
                          {statusConfig[user.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatCurrency(user.balance)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
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
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="h-4 w-4 mr-2" />
                              Ubah Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedUser(user);
                                setBanDialogOpen(true);
                              }}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              {user.status === 'BANNED' ? 'Unban User' : 'Ban User'}
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
              Menampilkan {filteredUsers.length} dari {mockUsers.length} user
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled>
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === 'BANNED' ? 'Unban User' : 'Ban User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.status === 'BANNED'
                ? `Apakah Anda yakin ingin unban ${selectedUser?.name}? User akan dapat mengakses platform kembali.`
                : `Apakah Anda yakin ingin ban ${selectedUser?.name}? User tidak akan dapat mengakses platform.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant={selectedUser?.status === 'BANNED' ? 'default' : 'destructive'}
              onClick={() => setBanDialogOpen(false)}
            >
              {selectedUser?.status === 'BANNED' ? 'Unban' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
