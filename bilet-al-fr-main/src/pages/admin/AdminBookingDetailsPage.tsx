import { useParams } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { bookingsService } from '@/services/bookings.service';
import { useApiResource } from '@/hooks/useApiResource';
import { money, dateTime } from '@/utils/formatters';

export function AdminBookingDetailsPage() {
  const { id } = useParams();
  const bookingQuery = useApiResource(['admin-booking', id], () => bookingsService.get(id ?? ''), undefined, { enabled: Boolean(id) });
  if (bookingQuery.isLoading) return <LoadingState text="Backend rezervasyonu yükleniyor..." />;
  if (bookingQuery.isError) return <ErrorState title="Rezervasyon yüklenemedi" text={(bookingQuery.error as Error).message} />;
  const booking = bookingQuery.data?.data;
  if (!booking) return <ErrorState title="Rezervasyon bulunamadı" text="Backend rezervasyon döndürmedi." />;
  return <main className="space-y-6"><AdminPageHeader eyebrow="Rezervasyon detayları" title={booking.bookingNumber} actions={<Badge>{booking.status}</Badge>} /><div className="grid gap-6 lg:grid-cols-2"><AdminSectionCard title="Özet"><div className="space-y-3 text-white/70"><p>Toplam: <strong className="text-theater-gold">{money(booking.total)}</strong></p><p>Kaynak: {booking.source}</p><p>Oluşturulma: {dateTime(booking.createdAt)}</p><p>Seans: {typeof booking.showtime === 'string' ? booking.showtime : booking.showtime.id}</p></div></AdminSectionCard><AdminSectionCard title="Koltuklar"><div className="space-y-2">{booking.seats.map(seat=><div key={seat.seatCode} className="flex justify-between rounded-xl border border-white/10 bg-white/[.035] p-3"><span>{seat.seatCode} · {seat.category}</span><span className="text-theater-gold">{money(seat.price)}</span></div>)}</div></AdminSectionCard></div></main>;
}
