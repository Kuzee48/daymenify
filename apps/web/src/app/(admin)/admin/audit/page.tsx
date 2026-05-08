'use client';

import { useState } from 'react';
import {
  Search,
  Download,
  Filter,
  Clock,
  User,
  Activity,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
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
} from '@/components/ui';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  entity: string;
  ipAddress: string;
}

const mockAuditLogs: AuditLog[] = [
  { id: '1', timestamp: '2024-01-15T10:30:15', user: 'admin@daymenify.com', action: 'UPDATE', module: 'Settings', entity: 'site_config', ipAddress: '103.156.78.12' },
  { id: '2', timestamp: '2024-01-15T10:28:42', user: 'admin@daymenify.com', action: 'APPROVE', module: 'Withdrawal', entity: 'WD-001234', ipAddress: '103.156.78.12' },
  { id: '3', timestamp: '2024-01-15T10:25:10', user: 'fitri.r@gmail.com', action: 'CREATE', module: 'Voucher', entity: 'FLASH15', ipAddress: '180.244.12.55' },
  { id: '4', timestamp: '2024-01-15T10:20:33', user: 'admin@daymenify.com', action: 'BAN', module: 'User', entity: 'user_id_003', ipAddress: '103.156.78.12' },
  { id: '5', timestamp: '2024-01-15T10:15:22', user: 'admin@daymenify.com', action: 'SYNC', module: 'Provider', entity: 'Digiflazz', ipAddress: '103.156.78.12' },
  { id: '6', timestamp: '2024-01-15T09:58:11', user: 'admin@daymenify.com', action: 'UPDATE', module: 'Product', entity: 'product_id_045', ipAddress: '103.156.78.12' },
  { id: '7', timestamp: '2024-01-15T09:45:05', user: 'admin@daymenify.com', action: 'TOGGLE', module: 'Gateway', entity: 'Xendit', ipAddress: '103.156.78.12' },
  { id: '8', timestamp: '2024-01-15T09:30:28', user: 'fitri.r@gmail.com', action: 'DELETE', module: 'Voucher', entity: 'XMAS2023', ipAddress: '180.244.12.55' },
  { id: '9', timestamp: '2024-01-15T09:15:44', user: 'admin@daymenify.com', action: 'REFUND', module: 'Transaction', entity: 'INV-20240114-089', ipAddress: '103.156.78.12' },
  { id: '10', timestamp: '2024-01-15T08:50:33', user: 'admin@daymenify.com', action: 'UPDATE', module: 'Markup', entity: 'rule_id_002', ipAddress: '103.156.78.12' },
  { id: '11', timestamp: '2024-01-15T08:30:17', user: 'admin@daymenify.com', action: 'CREATE', module: 'Product', entity: 'product_id_451', ipAddress: '103.156.78.12' },
  { id: '12', timestamp: '2024-01-14T23:45:00', user: 'system', action: 'SYNC', module: 'Provider', entity: 'VIP-Reseller', ipAddress: '127.0.0.1' },
  { id: '13', timestamp: '2024-01-14T23:00:00', user: 'system', action: 'CRON', module: 'System', entity: 'daily_report', ipAddress: '127.0.0.1' },
  { id: '14', timestamp: '2024-01-14T22:15:30', user: 'admin@daymenify.com', action: 'REJECT', module: 'Withdrawal', entity: 'WD-001230', ipAddress: '103.156.78.12' },
  { id: '15', timestamp: '2024-01-14T21:30:45', user: 'admin@daymenify.com', action: 'UPDATE', module: 'Settings', entity: 'notification_config', ipAddress: '103.156.78.12' },
];

const actionColors: Record<string, string> = {
  CREATE: 'bg-success/10 text-success border-success/20',
  UPDATE: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
  DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
  BAN: 'bg-destructive/10 text-destructive border-destructive/20',
  APPROVE: 'bg-success/10 text-success border-success/20',
  REJECT: 'bg-warning/10 text-warning border-warning/20',
  SYNC: 'bg-accent-500/10 text-accent-500 border-accent-500/20',
  REFUND: 'bg-warning/10 text-warning border-warning/20',
  TOGGLE: 'bg-muted text-muted-foreground',
  CRON: 'bg-muted text-muted-foreground',
};

const modules = ['Semua', 'Settings', 'Withdrawal', 'Voucher', 'User', 'Provider', 'Product', 'Gateway', 'Transaction', 'Markup', 'System'];

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('Semua');
  const [actionFilter, setActionFilter] = useState('Semua');

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === 'Semua' || log.module === moduleFilter;
    const matchAction = actionFilter === 'Semua' || log.action === actionFilter;
    return matchSearch && matchModule && matchAction;
  });

  const uniqueActions = [...new Set(mockAuditLogs.map((l) => l.action))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            Catatan aktivitas dan perubahan sistem
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary-500" />
              <p className="text-xs text-muted-foreground">Total Log Hari Ini</p>
            </div>
            <p className="text-xl font-bold text-foreground mt-1">
              {mockAuditLogs.filter((l) => l.timestamp.startsWith('2024-01-15')).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent-500" />
              <p className="text-xs text-muted-foreground">User Aktif</p>
            </div>
            <p className="text-xl font-bold text-foreground mt-1">
              {new Set(mockAuditLogs.map((l) => l.user)).size}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <p className="text-xs text-muted-foreground">Aksi Terakhir</p>
            </div>
            <p className="text-sm font-bold text-foreground mt-1">
              {new Date(mockAuditLogs[0].timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-success" />
              <p className="text-xs text-muted-foreground">Modul Terdampak</p>
            </div>
            <p className="text-xl font-bold text-foreground mt-1">
              {new Set(mockAuditLogs.map((l) => l.module)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari user atau entitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {modules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="Semua">Semua Aksi</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Input type="date" className="w-auto text-sm" />
              <span className="text-muted-foreground text-sm">—</span>
              <Input type="date" className="w-auto text-sm" />
            </div>
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
                  <TableHead>Waktu</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Modul</TableHead>
                  <TableHead>Entitas</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada log ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'text-xs',
                          log.user === 'system' ? 'text-muted-foreground italic' : 'text-foreground font-medium'
                        )}>
                          {log.user}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={actionColors[log.action] || 'bg-muted text-muted-foreground'}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.module}</TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {log.entity}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.ipAddress}
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
              Menampilkan {filteredLogs.length} dari {mockAuditLogs.length} log
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
