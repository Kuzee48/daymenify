import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar',
  description: 'Buat akun Daymenify baru',
};

export default function RegisterPage() {
  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Buat Akun Baru</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Daftar untuk mulai menggunakan Daymenify
        </p>
      </div>

      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
              Nama Depan
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="John"
              className="input-base mt-1.5"
              autoComplete="given-name"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
              Nama Belakang
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Doe"
              className="input-base mt-1.5"
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="nama@email.com"
            className="input-base mt-1.5"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            Nomor Telepon
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            className="input-base mt-1.5"
            autoComplete="tel"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Minimal 8 karakter"
            className="input-base mt-1.5"
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Gunakan minimal 8 karakter dengan kombinasi huruf dan angka
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Konfirmasi Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Ulangi password"
            className="input-base mt-1.5"
            autoComplete="new-password"
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="terms"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border text-primary-500 focus:ring-primary-500"
          />
          <label htmlFor="terms" className="text-xs text-muted-foreground">
            Saya menyetujui{' '}
            <a href="/terms" className="text-primary-500 hover:underline">
              Syarat & Ketentuan
            </a>{' '}
            dan{' '}
            <a href="/privacy" className="text-primary-500 hover:underline">
              Kebijakan Privasi
            </a>{' '}
            Daymenify.
          </label>
        </div>

        <button type="submit" className="btn-primary w-full">
          Daftar
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Sudah punya akun?{' '}
        <a href="/login" className="font-medium text-primary-500 hover:text-primary-600">
          Masuk
        </a>
      </p>
    </div>
  );
}
