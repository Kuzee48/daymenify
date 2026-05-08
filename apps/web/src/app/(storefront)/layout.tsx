export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container-app flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">Daymenify</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </a>
            <a href="/games" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Games
            </a>
            <a href="/vouchers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Voucher
            </a>
            <a href="/marketplace" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="/login" className="btn-secondary text-sm">
              Masuk
            </a>
            <a href="/register" className="btn-primary text-sm">
              Daftar
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container-app py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <span className="text-lg font-bold gradient-text">Daymenify</span>
              <p className="mt-3 text-sm text-muted-foreground">
                Platform top up game dan marketplace digital terpercaya di Indonesia.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Produk</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Top Up Game</li>
                <li>Voucher Digital</li>
                <li>Pulsa & Data</li>
                <li>Token Listrik</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Perusahaan</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Tentang Kami</li>
                <li>Karir</li>
                <li>Blog</li>
                <li>Kontak</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Bantuan</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>FAQ</li>
                <li>Kebijakan Privasi</li>
                <li>Syarat & Ketentuan</li>
                <li>Pusat Bantuan</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Daymenify. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
