'use client';

import { useState } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Globe,
  Percent,
  Wrench,
  Bell,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Separator,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';

// Markup rules mock data
const mockMarkupRules = [
  { id: '1', scope: 'Global', type: 'Persentase', value: '5%', priority: 1 },
  { id: '2', scope: 'Kategori: Game', type: 'Nominal', value: 'Rp 2.000', priority: 2 },
  { id: '3', scope: 'Kategori: Pulsa', type: 'Persentase', value: '3%', priority: 2 },
  { id: '4', scope: 'Produk: ML 86 Diamonds', type: 'Nominal', value: 'Rp 3.500', priority: 3 },
  { id: '5', scope: 'Role: Reseller', type: 'Persentase', value: '-2%', priority: 4 },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('umum');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    telegram: true,
    discord: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Sistem</h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi global platform Daymenify
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="umum">
            <Globe className="h-4 w-4 mr-1.5" />
            Umum
          </TabsTrigger>
          <TabsTrigger value="markup">
            <Percent className="h-4 w-4 mr-1.5" />
            Markup
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="h-4 w-4 mr-1.5" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="notifikasi">
            <Bell className="h-4 w-4 mr-1.5" />
            Notifikasi
          </TabsTrigger>
        </TabsList>

        {/* Tab: Umum */}
        <TabsContent value="umum" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
              <CardDescription>Informasi dasar platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Situs</label>
                  <Input defaultValue="Daymenify" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deskripsi</label>
                  <Input defaultValue="Platform Top Up Game & Pulsa Terpercaya" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomor WhatsApp</label>
                  <Input defaultValue="+6281234567890" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Support</label>
                  <Input defaultValue="support@daymenify.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instagram</label>
                  <Input defaultValue="@daymenify" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telegram Group</label>
                  <Input defaultValue="https://t.me/daymenify" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Facebook</label>
                  <Input defaultValue="https://facebook.com/daymenify" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">YouTube</label>
                  <Input defaultValue="https://youtube.com/@daymenify" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Markup */}
        <TabsContent value="markup" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aturan Markup Harga</CardTitle>
                  <CardDescription>Kelola markup otomatis berdasarkan scope dan prioritas</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Aturan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scope</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Nilai</TableHead>
                      <TableHead>Prioritas</TableHead>
                      <TableHead className="w-10">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockMarkupRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="text-sm font-medium">{rule.scope}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{rule.value}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{rule.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Catatan:</strong> Markup diterapkan berdasarkan prioritas. Prioritas lebih tinggi (angka lebih besar) menimpa yang lebih rendah. Markup negatif berarti diskon khusus.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Maintenance */}
        <TabsContent value="maintenance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mode Maintenance</CardTitle>
              <CardDescription>Aktifkan mode maintenance saat melakukan update sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Mode Maintenance</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {maintenanceMode
                      ? 'Platform sedang dalam mode maintenance. User tidak dapat mengakses.'
                      : 'Platform beroperasi normal.'}
                  </p>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    maintenanceMode ? 'bg-destructive' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {maintenanceMode && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pesan Maintenance</label>
                  <textarea
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
                    defaultValue="Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi. Terima kasih atas kesabarannya."
                  />
                </div>
              )}

              <Separator />
              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notifikasi */}
        <TabsContent value="notifikasi" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
              <CardDescription>Konfigurasi channel notifikasi sistem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Email Notifikasi</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kirim notifikasi transaksi ke email admin
                  </p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    notifications.email ? 'bg-success' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      notifications.email ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Telegram */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Telegram Bot</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kirim notifikasi via Telegram Bot
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, telegram: !notifications.telegram })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.telegram ? 'bg-success' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.telegram ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
                {notifications.telegram && (
                  <div className="ml-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bot Token</label>
                      <Input type="password" defaultValue="6543210987:AAF****" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chat ID</label>
                      <Input defaultValue="-1001234567890" />
                    </div>
                  </div>
                )}
              </div>

              {/* Discord */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Discord Webhook</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kirim notifikasi ke channel Discord
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, discord: !notifications.discord })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      notifications.discord ? 'bg-success' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        notifications.discord ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
                {notifications.discord && (
                  <div className="ml-4 space-y-2">
                    <label className="text-sm font-medium">Webhook URL</label>
                    <Input defaultValue="https://discord.com/api/webhooks/..." />
                  </div>
                )}
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
