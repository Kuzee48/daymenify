export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-background to-accent-50 py-20 lg:py-32">
        <div className="container-app relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Top Up Game &{' '}
              <span className="gradient-text">Voucher Digital</span>{' '}
              Tercepat
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Nikmati layanan top up game, pembelian voucher digital, pulsa, dan
              token listrik dengan proses instan. Harga terbaik dan transaksi
              aman hanya di Daymenify.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="/games" className="btn-primary px-8 py-3 text-base">
                Mulai Top Up
              </a>
              <a href="/marketplace" className="btn-secondary px-8 py-3 text-base">
                Jelajahi Marketplace
              </a>
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Kenapa Pilih Daymenify?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Kami menyediakan layanan terbaik untuk kebutuhan digital kamu
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Card 1 */}
            <div className="card-base text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
                <svg className="h-7 w-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Proses Instan
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Top up langsung masuk dalam hitungan detik. Tidak perlu menunggu lama.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="card-base text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-accent-100">
                <svg className="h-7 w-7 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Aman & Terpercaya
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Transaksi dijamin aman dengan enkripsi end-to-end dan berbagai metode pembayaran.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="card-base text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-success/10">
                <svg className="h-7 w-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                Harga Terbaik
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Dapatkan harga paling kompetitif dengan promo dan cashback menarik setiap hari.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Games Section */}
      <section className="bg-muted/50 py-20">
        <div className="container-app">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Game Populer</h2>
              <p className="mt-2 text-muted-foreground">
                Top up game favorit kamu dengan mudah
              </p>
            </div>
            <a href="/games" className="btn-secondary text-sm">
              Lihat Semua
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {['Mobile Legends', 'Free Fire', 'Genshin Impact', 'PUBG Mobile', 'Valorant', 'Honkai: Star Rail'].map(
              (game) => (
                <div
                  key={game}
                  className="card-base flex flex-col items-center p-4 text-center cursor-pointer hover:border-primary-300"
                >
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100" />
                  <span className="mt-3 text-xs font-medium text-foreground sm:text-sm">
                    {game}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-app">
          <div className="relative overflow-hidden rounded-2xl gradient-primary px-8 py-16 text-center text-white shadow-glow sm:px-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Siap Mulai Top Up?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/90">
              Bergabung dengan jutaan pengguna yang sudah mempercayai Daymenify
              untuk kebutuhan digital mereka.
            </p>
            <div className="mt-8">
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-medium text-primary-600 transition-all hover:bg-white/90 active:scale-[0.98]"
              >
                Daftar Gratis Sekarang
              </a>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/10" />
          </div>
        </div>
      </section>
    </>
  );
}
