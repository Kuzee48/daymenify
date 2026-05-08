'use client';

import { useState } from 'react';
import {
  Users,
  Copy,
  Share2,
  MessageCircle,
  Send,
  Link as LinkIcon,
  Trophy,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Crown,
  Medal,
} from 'lucide-react';

import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// Mock data
const referralCode = 'DAY7K2M';
const referralLink = `https://daymenify.com/register?ref=${referralCode}`;

const referralStats = {
  totalReferrals: 23,
  activeReferrals: 18,
  totalCommission: 1250000,
  monthlyCommission: 185000,
};

interface ReferralUser {
  id: string;
  name: string;
  joinDate: string;
  totalTransactions: number;
  totalCommission: number;
  status: 'active' | 'inactive';
}

interface CommissionEntry {
  id: string;
  date: string;
  fromUser: string;
  product: string;
  transactionAmount: number;
  commission: number;
  status: 'paid' | 'pending';
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  totalReferrals: number;
}

const mockReferralUsers: ReferralUser[] = [
  { id: 'r1', name: 'Ah***', joinDate: '2024-01-10T10:00:00Z', totalTransactions: 12, totalCommission: 85000, status: 'active' },
  { id: 'r2', name: 'Bu***', joinDate: '2024-01-05T14:00:00Z', totalTransactions: 8, totalCommission: 62000, status: 'active' },
  { id: 'r3', name: 'Ri***', joinDate: '2023-12-20T09:00:00Z', totalTransactions: 25, totalCommission: 195000, status: 'active' },
  { id: 'r4', name: 'De***', joinDate: '2023-12-15T16:00:00Z', totalTransactions: 5, totalCommission: 38000, status: 'active' },
  { id: 'r5', name: 'Fi***', joinDate: '2023-11-28T11:00:00Z', totalTransactions: 18, totalCommission: 142000, status: 'active' },
  { id: 'r6', name: 'Nu***', joinDate: '2023-11-10T08:00:00Z', totalTransactions: 3, totalCommission: 21000, status: 'inactive' },
  { id: 'r7', name: 'Pu***', joinDate: '2023-10-25T13:00:00Z', totalTransactions: 30, totalCommission: 245000, status: 'active' },
  { id: 'r8', name: 'Wa***', joinDate: '2023-10-15T15:00:00Z', totalTransactions: 0, totalCommission: 0, status: 'inactive' },
];

const mockCommissions: CommissionEntry[] = [
  { id: 'c1', date: '2024-01-15T14:30:00Z', fromUser: 'Ah***', product: 'ML - 86 Diamonds', transactionAmount: 22000, commission: 660, status: 'paid' },
  { id: 'c2', date: '2024-01-14T10:00:00Z', fromUser: 'Ri***', product: 'Genshin - Welkin Moon', transactionAmount: 75000, commission: 2250, status: 'paid' },
  { id: 'c3', date: '2024-01-13T18:00:00Z', fromUser: 'Fi***', product: 'Valorant - 1000 VP', transactionAmount: 149000, commission: 4470, status: 'paid' },
  { id: 'c4', date: '2024-01-12T09:30:00Z', fromUser: 'Bu***', product: 'FF - 100 Diamonds', transactionAmount: 15000, commission: 450, status: 'paid' },
  { id: 'c5', date: '2024-01-11T20:00:00Z', fromUser: 'Pu***', product: 'Token PLN 200K', transactionAmount: 200000, commission: 6000, status: 'pending' },
  { id: 'c6', date: '2024-01-10T12:00:00Z', fromUser: 'De***', product: 'Pulsa Telkomsel 50K', transactionAmount: 50000, commission: 1500, status: 'paid' },
  { id: 'c7', date: '2024-01-09T15:45:00Z', fromUser: 'Ri***', product: 'ML - 344 Diamonds', transactionAmount: 82000, commission: 2460, status: 'pending' },
  { id: 'c8', date: '2024-01-08T08:00:00Z', fromUser: 'Ah***', product: 'PUBG - 60 UC', transactionAmount: 16000, commission: 480, status: 'paid' },
  { id: 'c9', date: '2024-01-07T11:30:00Z', fromUser: 'Fi***', product: 'Voucher Google Play 100K', transactionAmount: 100000, commission: 3000, status: 'pending' },
  { id: 'c10', date: '2024-01-06T16:00:00Z', fromUser: 'Pu***', product: 'ML - 172 Diamonds', transactionAmount: 42000, commission: 1260, status: 'paid' },
];

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Ra***', totalReferrals: 87 },
  { rank: 2, name: 'An***', totalReferrals: 65 },
  { rank: 3, name: 'Fa***', totalReferrals: 52 },
  { rank: 4, name: 'Di***', totalReferrals: 41 },
  { rank: 5, name: 'Mu***', totalReferrals: 38 },
];

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Yuk daftar di Daymenify pakai kode referral saya: ${referralCode}\n\nDapatkan bonus saldo dan harga spesial!\n\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareTelegram = () => {
    const message = encodeURIComponent(
      `Yuk daftar di Daymenify pakai kode referral saya: ${referralCode}\n\nDapatkan bonus saldo dan harga spesial!`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Program Referral</h2>
        <p className="text-muted-foreground">
          Ajak teman dan dapatkan komisi dari setiap transaksi mereka.
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-accent-50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Share2 className="h-8 w-8 text-primary-600" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">Kode Referral Kamu</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-bold tracking-widest text-primary-700">
                {referralCode}
              </span>
              <Button variant="outline" size="sm" onClick={handleCopyCode}>
                <Copy className="mr-1 h-4 w-4" />
                {copied ? 'Tersalin!' : 'Salin'}
              </Button>
            </div>

            {/* Referral Link */}
            <div className="mt-4 flex w-full max-w-md items-center gap-2">
              <Input
                readOnly
                value={referralLink}
                className="text-xs bg-white"
              />
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <LinkIcon className="h-4 w-4" />
                {copiedLink ? 'Tersalin!' : ''}
              </Button>
            </div>

            {/* Share Buttons */}
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareWhatsApp}
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareTelegram}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Send className="mr-2 h-4 w-4" />
                Telegram
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Salin Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Info */}
      <Card className="border-success/20 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-success" />
            <p className="text-sm font-medium text-success">
              Dapatkan 3% komisi dari setiap transaksi yang dilakukan oleh pengguna yang kamu ajak!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Referral</p>
                <p className="text-lg font-bold text-foreground">{referralStats.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Referral Aktif</p>
                <p className="text-lg font-bold text-foreground">{referralStats.activeReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
                <TrendingUp className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Komisi</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(referralStats.totalCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Komisi Bulan Ini</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(referralStats.monthlyCommission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Referral Users & Commissions */}
      <Card>
        <CardContent className="p-4 pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="users">Daftar Referral</TabsTrigger>
              <TabsTrigger value="commissions">Riwayat Komisi</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Tanggal Bergabung</TableHead>
                      <TableHead className="text-right">Total Transaksi</TableHead>
                      <TableHead className="text-right">Total Komisi</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReferralUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.joinDate)}
                        </TableCell>
                        <TableCell className="text-right">{user.totalTransactions}</TableCell>
                        <TableCell className="text-right font-medium text-success">
                          {formatCurrency(user.totalCommission)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              user.status === 'active'
                                ? 'bg-success/10 text-success border-success/20'
                                : 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="commissions" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Dari User</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Transaksi</TableHead>
                      <TableHead className="text-right">Komisi</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCommissions.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell className="font-medium">{entry.fromUser}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm">
                          {entry.product}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(entry.transactionAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-success">
                          +{formatCurrency(entry.commission)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              entry.status === 'paid'
                                ? 'bg-success/10 text-success border-success/20'
                                : 'bg-warning/10 text-warning border-warning/20'
                            )}
                          >
                            {entry.status === 'paid' ? 'Dibayar' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-warning" />
            Leaderboard Bulan Ini
          </CardTitle>
          <CardDescription>Top 5 referrer dengan referral terbanyak</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockLeaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3',
                  entry.rank === 1 && 'border-warning/30 bg-warning/5',
                  entry.rank === 2 && 'border-gray-300 bg-gray-50',
                  entry.rank === 3 && 'border-orange-200 bg-orange-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                    entry.rank === 1 && 'bg-warning/20 text-warning',
                    entry.rank === 2 && 'bg-gray-200 text-gray-600',
                    entry.rank === 3 && 'bg-orange-200 text-orange-600',
                    entry.rank > 3 && 'bg-muted text-muted-foreground'
                  )}>
                    {entry.rank <= 3 ? (
                      <Crown className="h-4 w-4" />
                    ) : (
                      entry.rank
                    )}
                  </div>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">{entry.totalReferrals}</span>
                  <span className="ml-1 text-xs text-muted-foreground">referral</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
