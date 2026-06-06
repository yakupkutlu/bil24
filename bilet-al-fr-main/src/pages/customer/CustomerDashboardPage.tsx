import { CalendarClock, ReceiptText, RotateCcw, Ticket } from 'lucide-react';
import { CustomerHero } from '@/components/customer/CustomerHero';
import { JourneyTimeline } from '@/components/customer/JourneyTimeline';
import { LoyaltySpotlightCard } from '@/components/customer/LoyaltySpotlightCard';
import { ReservationCard } from '@/components/customer/ReservationCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { TicketCard } from '@/components/tickets/TicketCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useAuthStore } from '@/stores/auth.store';
import { bookingsService } from '@/services/bookings.service';
import { ticketsService } from '@/services/tickets.service';
import { eventsService } from '@/services/events.service';
import { useApiResource } from '@/hooks/useApiResource';

export function CustomerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const ticketsQuery = useApiResource(['customer-dashboard-tickets'], () => ticketsService.my());
  const bookingsQuery = useApiResource(['customer-dashboard-bookings'], () => bookingsService.my());
  const eventsQuery = useApiResource(['customer-dashboard-events'], () => eventsService.list({ status: 'PUBLISHED', limit: 3 }));

  if (ticketsQuery.isLoading || bookingsQuery.isLoading || eventsQuery.isLoading) return <LoadingState text="Canlı müşteri panelin yükleniyor..." />;
  if (ticketsQuery.isError) return <ErrorState title="Biletler yüklenemedi" text={(ticketsQuery.error as Error).message} />;
  if (bookingsQuery.isError) return <ErrorState title="Rezervasyonlar yüklenemedi" text={(bookingsQuery.error as Error).message} />;

  const tickets = ticketsQuery.data?.data ?? [];
  const bookings = bookingsQuery.data?.data ?? [];
  const reservations = bookings.filter((booking) => ['RESERVED', 'PENDING'].includes(booking.status));
  const nextTicket = tickets.find((ticket) => ticket.status === 'VALID');

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <CustomerHero fullName={user?.fullName} nextTicket={nextTicket} />
      <div className="grid gap-4 md:grid-cols-4"><DashboardCard title="Canlı biletler" value={tickets.length} icon={<Ticket />} hint="/api/tickets/my üzerinden" /><DashboardCard title="Rezervasyonlar" value={reservations.length} icon={<CalendarClock />} hint="/api/bookings/my üzerinden" /><DashboardCard title="Siparişler" value={bookings.length} icon={<ReceiptText />} hint="Backend rezervasyonları" /><DashboardCard title="İade edilebilir" value={bookings.filter((b)=>b.status==='PAID').length} icon={<RotateCcw />} hint="Ödenmiş siparişler" /></div>
      <section className="grid gap-6 lg:grid-cols-[1fr_.85fr]"><div className="space-y-4"><h2 className="font-serif text-3xl text-white">Yaklaşan tickets</h2>{tickets.length ? tickets.slice(0,2).map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />) : <EmptyState title="Henüz bilet yok" text="Burada görmek için canlı etkinliklerden bir bilet satın al." />}</div><div className="space-y-5"><JourneyTimeline /><LoyaltySpotlightCard /></div></section>
      <section className="space-y-4"><h2 className="font-serif text-3xl text-white">Aktif rezervasyonlar</h2>{reservations.length ? reservations.map((booking, index) => <ReservationCard key={booking.id} booking={booking} index={index} />) : <EmptyState title="Aktif rezervasyon yok" text="Rezerve edilmiş/bekleyen backend rezervasyonları burada görünecek." />}</section>
    </main>
  );
}
