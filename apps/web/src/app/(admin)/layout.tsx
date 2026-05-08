'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  ArrowDownToLine,
  Ticket,
  Zap,
  Image,
  Server,
  CreditCard,
  Settings,
  ScrollText,
  Bell,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

const navGroups = [
  {
    label: 'Main',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    ],
  },
  {
    label: 'Transaksi',
    items: [
      { href: '/admin/transactions', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/vouchers', label: 'Vouchers', icon: Ticket },
      { href: '/admin/flash-sales', label: 'Flash Sales', icon: Zap },
      { href: '/admin/banners', label: 'Banners', icon: Image },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/providers', label: 'Providers', icon: Server },
      { href: '/admin/gateways', label: 'Gateways', icon: CreditCard },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const currentPage = navGroups
    .flatMap((g) => g.items)
    .find((item) => isActive(item.href));

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <span className="text-lg font-bold text-white">Daymenify</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-400">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Administrator</p>
            <p className="text-xs text-slate-400 truncate">admin@daymenify.com</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-700/50 bg-slate-900 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex h-full w-64 flex-col bg-slate-900">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
              <span>Admin</span>
              {currentPage && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{currentPage.label}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">A</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
