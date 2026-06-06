import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, DoorOpen, ScanLine, Ticket, Timer, WalletCards } from 'lucide-react';
import { StaffShiftHero } from '@/components/box-office/StaffShiftHero';
import { LiveShowRunCard } from '@/components/box-office/LiveShowRunCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useApiResource } from '@/hooks/useApiResource';
import { showtimesService } from '@/services/showtimes.service';
import { bookingsService } from '@/services/bookings.service';
import { paymentsService } from '@/services/payments.service';

const gateTimeline = [
  { time: '18:30', title: 'Vardiya açıldı', note: 'Kasa çekmecesi ve POS kontrol edildi' },
  { time: '19:00', title: 'Kapılar hazır', note: 'QR tarayıcı Büyük Sahne’de çevrim içi' },
  { time: '19:30', title: 'Seyirci girişi', note: 'Ana doğrulama akışı başlıyor' },
  { time: '20:00', title: 'Perde zamanı', note: 'Geç girişler personel için işaretlendi' }
];

export function BoxOfficeDashboardPage() {
  const showtimesQuery = useApiResource(['box-office-dashboard-showtimes'], () => showtimesService.list({ today: true }));
  const bookingsQuery = useApiResource(['box-office-dashboard-bookings'], () => bookingsService.list({ source: 'BOX_OFFICE' }));
  const paymentsQuery = useApiResource(['box-office-dashboard-payments'], () => paymentsService.list({ source: 'BOX_OFFICE' }));
  if (showtimesQuery.isLoading || bookingsQuery.isLoading || paymentsQuery.isLoading) return <LoadingState text="Backend gişe paneli yükleniyor..." />;
  if (showtimesQuery.isError) return <ErrorState title="Seanslar yüklenemedi" text={(showtimesQuery.error as Error).message} />;
  const showtimes = showtimesQuery.data?.data ?? [];
  const bookings = bookingsQuery.data?.data ?? [];
  const payments = paymentsQuery.data?.data ?? [];
  const pending = bookings.filter((booking) => ['PENDING', 'RESERVED'].includes(booking.status));
  const cashTotal = payments.filter((p)=>p.method==='CASH').reduce((sum,p)=>sum+p.amount,0);

  return <main className="space-y-8"><div className="grid gap-4 md:grid-cols-4"><DashboardCard title="Bugünkü seanslar" value={showtimes.length} icon={<CalendarDays />} hint="/api/showtimes üzerinden" /><DashboardCard title="Bugün satılan" value={bookings.filter((b)=>b.status==='PAID').length} icon={<Ticket />} hint="Backend rezervasyonları" /><DashboardCard title="Bekleyen kilitler" value={pending.length} icon={<Timer />} hint="Ödeme veya bırakma gerekiyor" /><DashboardCard title="Kasa" value={`₺${cashTotal}`} icon={<WalletCards />} hint="Mevcut vardiya toplamı" /></div><section className="grid gap-6 "><div className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm uppercase tracking-[.28em] text-theater-gold">Canlı operations</p><h2 className="font-serif text-4xl text-white">Bugün’s stage runs</h2></div><div className="flex gap-2"><Button asChild size="sm"><Link to="/box-office/sell-ticket"><Ticket size={16} /> Manuel satış</Link></Button><Button asChild size="sm" variant="outline"><Link to="/box-office/verify"><ScanLine size={16} /> Verify QR</Link></Button></div></div>{showtimes.length ? showtimes.map((show) => <LiveShowRunCard key={show.id} showtime={show} sold={0} capacity={typeof show.hall === 'string' ? 0 : show.hall.capacity} />) : <EmptyState title="Bugün seans yok" text="Backend bugün için seans döndürmedi." />}</div></section></main>;
}
