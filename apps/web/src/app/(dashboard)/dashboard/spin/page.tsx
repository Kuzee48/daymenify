'use client';

import { useState, useCallback } from 'react';
import {
  RotateCw,
  Ticket,
  Gift,
  Star,
  ShoppingBag,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';

import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// Wheel segments
interface WheelSegment {
  label: string;
  value: number;
  color: string;
  textColor: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
}

const segments: WheelSegment[] = [
  { label: 'Rp 500', value: 500, color: '#3b82f6', textColor: '#ffffff', rarity: 'Common' },
  { label: 'Rp 1.000', value: 1000, color: '#8b5cf6', textColor: '#ffffff', rarity: 'Common' },
  { label: 'Rp 2.500', value: 2500, color: '#06b6d4', textColor: '#ffffff', rarity: 'Uncommon' },
  { label: 'Rp 5.000', value: 5000, color: '#10b981', textColor: '#ffffff', rarity: 'Uncommon' },
  { label: 'Rp 10.000', value: 10000, color: '#f59e0b', textColor: '#ffffff', rarity: 'Rare' },
  { label: 'Voucher 5%', value: 0, color: '#ec4899', textColor: '#ffffff', rarity: 'Rare' },
  { label: 'Rp 25.000', value: 25000, color: '#ef4444', textColor: '#ffffff', rarity: 'Epic' },
  { label: 'JACKPOT', value: 100000, color: '#f97316', textColor: '#ffffff', rarity: 'Legendary' },
];

// Spin history
interface SpinHistoryEntry {
  id: string;
  date: string;
  reward: string;
  value: number;
  status: 'delivered' | 'pending';
}

const mockSpinHistory: SpinHistoryEntry[] = [
  { id: 's1', date: '2024-01-15T14:30:00Z', reward: 'Rp 2.500', value: 2500, status: 'delivered' },
  { id: 's2', date: '2024-01-14T10:00:00Z', reward: 'Rp 500', value: 500, status: 'delivered' },
  { id: 's3', date: '2024-01-13T18:30:00Z', reward: 'Rp 5.000', value: 5000, status: 'delivered' },
  { id: 's4', date: '2024-01-12T09:00:00Z', reward: 'Voucher 5%', value: 0, status: 'pending' },
  { id: 's5', date: '2024-01-11T20:00:00Z', reward: 'Rp 1.000', value: 1000, status: 'delivered' },
  { id: 's6', date: '2024-01-10T12:00:00Z', reward: 'Rp 10.000', value: 10000, status: 'delivered' },
  { id: 's7', date: '2024-01-09T15:45:00Z', reward: 'Rp 500', value: 500, status: 'delivered' },
  { id: 's8', date: '2024-01-08T08:00:00Z', reward: 'Rp 2.500', value: 2500, status: 'delivered' },
];

const rarityColors: Record<string, string> = {
  Common: 'bg-gray-100 text-gray-600 border-gray-200',
  Uncommon: 'bg-green-100 text-green-700 border-green-200',
  Rare: 'bg-blue-100 text-blue-700 border-blue-200',
  Epic: 'bg-purple-100 text-purple-700 border-purple-200',
  Legendary: 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function SpinWheelPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [tickets, setTickets] = useState(3);
  const [showProbabilities, setShowProbabilities] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSpin = useCallback(() => {
    if (isSpinning || tickets <= 0) return;

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);
    setShowConfetti(false);

    // Determine winning segment (weighted random)
    const weights = [30, 25, 18, 12, 7, 5, 2, 1]; // percentage weights
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let winningIndex = 0;

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        winningIndex = i;
        break;
      }
    }

    // Calculate rotation
    const segmentAngle = 360 / segments.length;
    const targetAngle = 360 - (winningIndex * segmentAngle + segmentAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const finalRotation = rotation + (fullSpins * 360) + targetAngle - (rotation % 360);

    setRotation(finalRotation);
    setTickets((prev) => prev - 1);

    // Show result after spin animation completes
    setTimeout(() => {
      setIsSpinning(false);
      setResult(segments[winningIndex]);
      setShowResult(true);
      setShowConfetti(true);

      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000);
    }, 4000);
  }, [isSpinning, tickets, rotation]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Spin & Menang</h2>
        <p className="text-muted-foreground">
          Putar roda keberuntungan dan menangkan hadiah menarik!
        </p>
      </div>

      {/* Ticket Info */}
      <Card className="border-primary-200 bg-gradient-to-r from-primary-50 to-accent-50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
              <Ticket className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Tiket Spin</p>
              <p className="text-xs text-muted-foreground">Tersedia untuk digunakan</p>
            </div>
          </div>
          <span className="text-3xl font-bold text-primary-700">{tickets}</span>
        </CardContent>
      </Card>

      {/* Spin Wheel */}
      <Card>
        <CardContent className="flex flex-col items-center p-6 relative overflow-hidden">
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${1 + Math.random() * 2}s`,
                  }}
                >
                  <Sparkles
                    className="h-4 w-4"
                    style={{
                      color: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'][
                        Math.floor(Math.random() * 6)
                      ],
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Wheel Container */}
          <div className="relative mb-6">
            {/* Pointer */}
            <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
              <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary-600" />
            </div>

            {/* Wheel */}
            <div
              className="relative h-64 w-64 rounded-full border-4 border-primary-200 shadow-lg sm:h-80 sm:w-80"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                  : 'none',
              }}
            >
              {segments.map((segment, index) => {
                const angle = (360 / segments.length) * index;
                const skew = 90 - 360 / segments.length;
                return (
                  <div
                    key={index}
                    className="absolute left-1/2 top-0 h-1/2 origin-bottom-left overflow-hidden"
                    style={{
                      width: '50%',
                      transform: `rotate(${angle}deg) skewY(-${skew}deg)`,
                    }}
                  >
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        backgroundColor: segment.color,
                        transform: `skewY(${skew}deg) rotate(${360 / segments.length / 2}deg)`,
                      }}
                    >
                      <span
                        className="text-[9px] font-bold sm:text-xs"
                        style={{ color: segment.textColor }}
                      >
                        {segment.label}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Center circle */}
              <div className="absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md border-2 border-primary-200 sm:h-16 sm:w-16">
                <Star className="h-5 w-5 text-primary-600 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          {/* Spin Button */}
          <Button
            size="lg"
            onClick={handleSpin}
            disabled={isSpinning || tickets <= 0}
            className="mt-4 px-10 py-6 text-lg font-bold"
          >
            {isSpinning ? (
              <>
                <RotateCw className="mr-2 h-5 w-5 animate-spin" />
                Memutar...
              </>
            ) : tickets <= 0 ? (
              'Tiket Habis'
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                PUTAR!
              </>
            )}
          </Button>

          {/* Result Display */}
          {showResult && result && (
            <div className="mt-6 rounded-xl border-2 border-success/30 bg-success/5 p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 text-success" />
                <p className="text-sm font-medium text-success">Selamat! Kamu mendapatkan:</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{result.label}</p>
              {result.value > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Saldo {formatCurrency(result.value)} telah ditambahkan ke dompet kamu!
                </p>
              )}
              {result.label === 'Voucher 5%' && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Voucher diskon 5% berlaku untuk pembelian berikutnya!
                </p>
              )}
              <Badge variant="outline" className={cn('mt-2', rarityColors[result.rarity])}>
                {result.rarity}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to Get Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="h-5 w-5 text-primary-600" />
            Cara Mendapatkan Tiket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100">
                <Users className="h-4 w-4 text-accent-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Referral</p>
                <p className="text-xs text-muted-foreground">
                  Ajak 1 teman bergabung = 1 tiket spin
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <ShoppingBag className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">Pembelian</p>
                <p className="text-xs text-muted-foreground">
                  Belanja min. Rp 100.000 = 1 tiket spin
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                <Calendar className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">Login Harian</p>
                <p className="text-xs text-muted-foreground">
                  Login setiap hari = 1 tiket spin
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spin History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Riwayat Spin</CardTitle>
          <CardDescription>Hadiah yang telah kamu dapatkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Hadiah</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSpinHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="font-medium">{entry.reward}</TableCell>
                    <TableCell className="text-right text-sm">
                      {entry.value > 0 ? formatCurrency(entry.value) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          entry.status === 'delivered'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-warning/10 text-warning border-warning/20'
                        )}
                      >
                        {entry.status === 'delivered' ? 'Dikirim' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reward Probabilities (Collapsible) */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowProbabilities(!showProbabilities)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-primary-600" />
              Probabilitas Hadiah
            </CardTitle>
            {showProbabilities ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showProbabilities && (
          <CardContent>
            <div className="space-y-2">
              {segments.map((segment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm font-medium">{segment.label}</span>
                  </div>
                  <Badge variant="outline" className={cn('text-xs', rarityColors[segment.rarity])}>
                    {segment.rarity}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              * Probabilitas hadiah diatur berdasarkan tingkat kelangkaan (rarity). 
              Common memiliki peluang tertinggi, Legendary memiliki peluang terendah.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
