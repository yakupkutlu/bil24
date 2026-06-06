import { CalendarClock } from 'lucide-react';
import { ReservationCard } from '@/components/customer/ReservationCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { bookingsService } from '@/services/bookings.service';
import { useApiResource } from '@/hooks/useApiResource';

export function CustomerReservationsPage() {
  const reservationsQuery = useApiResource(['customer-reservations'], () => bookingsService.my({ status: 'RESERVED' }));
  if (reservationsQuery.isLoading) return <LoadingState text="Backend rezervasyonları yükleniyor..." />;
  if (reservationsQuery.isError) return <ErrorState title="Rezervasyonlar yüklenemedi" text={(reservationsQuery.error as Error).message} />;
  const reservations = (reservationsQuery.data?.data ?? []).filter((booking) => ['RESERVED', 'PENDING'].includes(booking.status));
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8"><section className="rounded-[2rem] border border-white/10 bg-white/[.045] p-7"><p className="flex items-center gap-2 text-sm uppercase tracking-[.28em] text-theater-gold"><CalendarClock size={16}/> Rezervasyonlar</p><h1 className="mt-3 font-serif text-5xl text-white">Aktif backend reservations</h1><p className="mt-3 text-white/60">Loaded from /api/bookings/my. Rezervasyon rows come from backend only.</p></section>{reservations.length ? reservations.map((booking, index)=><ReservationCard key={booking.id} booking={booking} index={index}/>) : <EmptyState title="Aktif rezervasyon yok" text="Backend rezerve edilmiş veya bekleyen rezervasyon döndürmedi." />}</main>;
}
