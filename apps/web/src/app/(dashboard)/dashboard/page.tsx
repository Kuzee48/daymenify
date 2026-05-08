import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Kelola akun dan transaksi kamu',
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Halo, User!</h2>
        <p className="text-muted-foreground">
          Berikut ringkasan akun dan aktivitas terbaru kamu.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-base">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-lg font-bold text-foreground">Rp 150.000</p>
            </div>
          </div>
        </div>

        <div className="card-base">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transaksi Sukses</p>
              <p className="text-lg font-bold text-foreground">24</p>
            </div>
          </div>
        </div>

        <div className="card-base">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <svg className="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dalam Proses</p>
              <p className="text-lg font-bold text-foreground">2</p>
            </div>
          </div>
        </div>

        <div className="card-base">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
              <svg className="h-5 w-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Belanja</p>
              <p className="text-lg font-bold text-foreground">Rp 2.4jt</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-base">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Pesanan Terbaru</h3>
          <a href="/dashboard/orders" className="text-sm font-medium text-primary-500 hover:text-primary-600">
            Lihat Semua
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Order ID</th>
                <th className="pb-3 font-medium text-muted-foreground">Produk</th>
                <th className="pb-3 font-medium text-muted-foreground">Total</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
                <th className="pb-3 font-medium text-muted-foreground">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 font-mono text-xs">#DM-00124</td>
                <td className="py-3">Mobile Legends - 86 Diamonds</td>
                <td className="py-3">Rp 22.000</td>
                <td className="py-3">
                  <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    Sukses
                  </span>
                </td>
                <td className="py-3 text-muted-foreground">12 Jun 2024</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-xs">#DM-00123</td>
                <td className="py-3">Free Fire - 100 Diamonds</td>
                <td className="py-3">Rp 15.000</td>
                <td className="py-3">
                  <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    Sukses
                  </span>
                </td>
                <td className="py-3 text-muted-foreground">11 Jun 2024</td>
              </tr>
              <tr>
                <td className="py-3 font-mono text-xs">#DM-00122</td>
                <td className="py-3">Pulsa Telkomsel 50K</td>
                <td className="py-3">Rp 50.000</td>
                <td className="py-3">
                  <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                    Proses
                  </span>
                </td>
                <td className="py-3 text-muted-foreground">10 Jun 2024</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
