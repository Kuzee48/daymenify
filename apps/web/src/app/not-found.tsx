import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Halaman Tidak Ditemukan',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6 text-8xl font-bold gradient-text">404</div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-3 text-muted-foreground">
          Maaf, halaman yang kamu cari tidak tersedia atau sudah dipindahkan.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a href="/" className="btn-primary">
            Kembali ke Beranda
          </a>
          <a href="/help" className="btn-secondary">
            Pusat Bantuan
          </a>
        </div>
      </div>
    </div>
  );
}
