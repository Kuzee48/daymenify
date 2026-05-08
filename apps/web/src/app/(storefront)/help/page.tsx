'use client';

import { useState } from 'react';
import {
  Search,
  ChevronDown,
  MessageCircle,
  Mail,
  Clock,
  Phone,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    title: 'Cara Top Up',
    items: [
      {
        question: 'Bagaimana cara top up game?',
        answer:
          'Untuk melakukan top up game di Daymenify, ikuti langkah berikut: 1) Pilih game yang ingin di-top up dari halaman utama atau kategori, 2) Pilih nominal/paket yang diinginkan, 3) Masukkan User ID dan Server ID (jika diperlukan), 4) Pilih metode pembayaran, 5) Selesaikan pembayaran. Diamond/item akan masuk ke akun game kamu dalam 1-5 menit.',
      },
      {
        question: 'Berapa lama proses top up?',
        answer:
          'Proses top up biasanya membutuhkan waktu 1-5 menit setelah pembayaran dikonfirmasi. Untuk beberapa produk tertentu, proses bisa memakan waktu hingga 15 menit pada jam sibuk. Jika setelah 30 menit item belum masuk, silakan hubungi customer service kami.',
      },
      {
        question: 'Apakah bisa top up tanpa login?',
        answer:
          'Ya, kamu bisa melakukan top up tanpa perlu login atau membuat akun. Cukup masukkan data yang dibutuhkan (User ID, Server ID, atau nomor telepon) dan selesaikan pembayaran. Namun, dengan membuat akun kamu bisa menikmati fitur riwayat transaksi dan promo eksklusif.',
      },
    ],
  },
  {
    title: 'Pembayaran',
    items: [
      {
        question: 'Metode pembayaran apa saja yang tersedia?',
        answer:
          'Daymenify menyediakan berbagai metode pembayaran: QRIS (scan QR dari semua e-wallet dan mobile banking), E-Wallet (GoPay, OVO, DANA, ShopeePay, LinkAja), Bank Transfer (BCA, BNI, BRI, Mandiri, BSI), Minimarket (Indomaret, Alfamart), dan Pulsa (Telkomsel, XL, Indosat).',
      },
      {
        question: 'Bagaimana jika pembayaran gagal?',
        answer:
          'Jika pembayaran gagal, dana kamu akan dikembalikan secara otomatis ke metode pembayaran yang digunakan dalam waktu 1x24 jam. Untuk e-wallet, refund biasanya instan. Untuk bank transfer, proses refund bisa memakan waktu 1-3 hari kerja. Pastikan saldo atau limit kamu mencukupi sebelum melakukan pembayaran.',
      },
      {
        question: 'Apakah ada biaya admin untuk pembayaran?',
        answer:
          'Biaya admin bervariasi tergantung metode pembayaran yang dipilih. Pembayaran via QRIS dan e-wallet umumnya tidak dikenakan biaya admin. Bank transfer dan minimarket mungkin dikenakan biaya admin kecil yang akan ditampilkan sebelum kamu menyelesaikan pembayaran.',
      },
    ],
  },
  {
    title: 'Akun',
    items: [
      {
        question: 'Bagaimana cara mendaftar?',
        answer:
          'Untuk mendaftar akun Daymenify: 1) Klik tombol "Daftar" di halaman utama, 2) Masukkan email, nama lengkap, dan password, 3) Verifikasi email melalui link yang dikirimkan, 4) Akun kamu siap digunakan! Kamu juga bisa mendaftar menggunakan akun Google.',
      },
      {
        question: 'Lupa password, bagaimana cara reset?',
        answer:
          'Untuk mereset password: 1) Klik "Lupa Password" di halaman login, 2) Masukkan email yang terdaftar, 3) Cek inbox email kamu (termasuk folder spam), 4) Klik link reset password, 5) Buat password baru. Link reset berlaku selama 1 jam.',
      },
    ],
  },
  {
    title: 'Lainnya',
    items: [
      {
        question: 'Apakah Daymenify aman?',
        answer:
          'Ya, Daymenify adalah platform top up game dan voucher digital terpercaya. Kami menggunakan enkripsi SSL untuk melindungi data transaksi, bekerja sama dengan payment gateway resmi, dan sudah melayani ratusan ribu transaksi sukses. Data pribadi kamu dilindungi sesuai kebijakan privasi kami.',
      },
      {
        question: 'Bagaimana cara menghubungi customer service?',
        answer:
          'Kamu bisa menghubungi customer service kami melalui: WhatsApp di 0812-3456-7890 (respon tercepat), Email di support@daymenify.com, atau melalui fitur Live Chat di website. Tim CS kami beroperasi setiap hari Senin-Minggu pukul 08:00-22:00 WIB.',
      },
      {
        question: 'Apakah ada program referral atau affiliate?',
        answer:
          'Ya! Daymenify memiliki program referral di mana kamu bisa mengajak teman dan mendapatkan bonus poin reward. Setiap teman yang mendaftar dan melakukan transaksi pertama menggunakan kode referral kamu, kalian berdua akan mendapatkan bonus poin. Cek halaman Referral di dashboard untuk info lebih lanjut.',
      },
    ],
  },
];

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-primary-600"
      >
        <span className="text-sm font-medium text-foreground pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = faqSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          !searchQuery.trim() ||
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-foreground">Bantuan & FAQ</h1>
        <p className="mt-2 text-muted-foreground">
          Temukan jawaban untuk pertanyaan yang sering ditanyakan.
        </p>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari pertanyaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="mx-auto mt-10 max-w-2xl space-y-6">
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <Card key={section.title}>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {section.items.map((item) => (
                  <FAQAccordionItem key={item.question} item={item} />
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Tidak ditemukan pertanyaan yang sesuai dengan pencarian kamu.
            </p>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <Separator className="mx-auto my-12 max-w-2xl" />
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-6 text-center text-xl font-bold text-foreground">
          Masih Butuh Bantuan?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <MessageCircle className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-sm font-semibold">WhatsApp</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Respon tercepat
              </p>
              <Button
                size="sm"
                className="mt-3 bg-success hover:bg-success/90"
                asChild
              >
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone className="mr-1.5 h-3.5 w-3.5" />
                  Chat Sekarang
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <Mail className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-sm font-semibold">Email</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                support@daymenify.com
              </p>
              <Button size="sm" variant="outline" className="mt-3" asChild>
                <a href="mailto:support@daymenify.com">Kirim Email</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-100">
                <Clock className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-sm font-semibold">Jam Operasional</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Senin - Minggu
              </p>
              <p className="text-xs font-medium text-foreground">
                08:00 - 22:00 WIB
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
