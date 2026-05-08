import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Daymenify admin panel',
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Overview</h2>
        <p className="text-muted-foreground">
          Monitor platform performance and manage resources.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-base">
          <p className="text-xs font-medium uppercase text-muted-foreground">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-foreground">12,847</p>
          <p className="mt-1 text-xs text-success">+12.5% from last month</p>
        </div>
        <div className="card-base">
          <p className="text-xs font-medium uppercase text-muted-foreground">Revenue (30d)</p>
          <p className="mt-2 text-3xl font-bold text-foreground">Rp 847jt</p>
          <p className="mt-1 text-xs text-success">+8.2% from last month</p>
        </div>
        <div className="card-base">
          <p className="text-xs font-medium uppercase text-muted-foreground">Active Orders</p>
          <p className="mt-2 text-3xl font-bold text-foreground">342</p>
          <p className="mt-1 text-xs text-warning">23 pending review</p>
        </div>
        <div className="card-base">
          <p className="text-xs font-medium uppercase text-muted-foreground">Success Rate</p>
          <p className="mt-2 text-3xl font-bold text-foreground">99.2%</p>
          <p className="mt-1 text-xs text-success">Above target (98%)</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-base">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'New user registered', time: '2 min ago', type: 'user' },
              { action: 'Order #DM-00125 completed', time: '5 min ago', type: 'order' },
              { action: 'Provider DigiFlazz synced', time: '12 min ago', type: 'system' },
              { action: 'Payment received Rp 150.000', time: '18 min ago', type: 'payment' },
              { action: 'Product prices updated', time: '25 min ago', type: 'product' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-base">
          <h3 className="text-lg font-semibold text-foreground mb-4">System Health</h3>
          <div className="space-y-4">
            {[
              { service: 'API Server', status: 'healthy', uptime: '99.99%' },
              { service: 'Database', status: 'healthy', uptime: '99.98%' },
              { service: 'Redis Cache', status: 'healthy', uptime: '100%' },
              { service: 'Payment Gateway', status: 'healthy', uptime: '99.95%' },
              { service: 'Provider API', status: 'degraded', uptime: '98.5%' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      item.status === 'healthy' ? 'bg-success' : 'bg-warning'
                    }`}
                  />
                  <span className="text-sm font-medium text-foreground">{item.service}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.uptime}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
