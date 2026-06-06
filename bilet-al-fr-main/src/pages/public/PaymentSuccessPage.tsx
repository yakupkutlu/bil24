import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, Printer, Sparkles, TicketCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { TicketCard } from '@/components/tickets/TicketCard';
import { ConfettiBurst } from '@/components/tickets/ConfettiBurst';
import { useBookingStore } from '@/stores/booking.store';
import { money } from '@/utils/formatters';
import { ticketsService } from '@/services/tickets.service';
import { useApiResource } from '@/hooks/useApiResource';
import { ApiModeBadge } from '@/components/integration/ApiModeBadge';
import { printTickets } from '@/utils/ticketPrint';
import { useToast } from '@/components/ui/ToastProvider';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

export function PaymentSuccessPage() {
  const { showToast } = useToast();
  const [params] = useSearchParams();
  const priceSummary = useBookingStore((state) => state.priceSummary);
  const storeBookingId = useBookingStore((state) => state.bookingId);
  const bookingNumber = useBookingStore((state) => state.bookingNumber);
  const bookingId = params.get('bookingId') || storeBookingId;
  const paymentId = params.get('paymentId');

  const ticketsQuery = useApiResource(['tickets-after-checkout', bookingId], async () => {
    if (bookingId) return ticketsService.listByBooking(bookingId);
    return ticketsService.my();
  }, [], { enabled: true });

  if (ticketsQuery.isLoading) return <LoadingState text="Oluşturulan biletler backendden yükleniyor..." />;
  if (ticketsQuery.isError) return <ErrorState title="Biletler yüklenemedi" text={(ticketsQuery.error as Error).message} />;

  const visibleTickets = ticketsQuery.data?.data ?? [];
  const visibleBookingNumber = bookingNumber ?? bookingId ?? paymentId ?? 'Backend rezervasyonu';

  const printAll = () => {
    try { printTickets(visibleTickets, String(visibleBookingNumber)); showToast('Tüm biletler için yazdırma penceresi açıldı.'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Biletler yazdırılamadı.', 'error'); }
  };
  const downloadAll = async () => {
    try { for (const ticket of visibleTickets) await ticketsService.downloadPdf(ticket); showToast('Bilet PDF indirmeleri başladı.'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Bir veya daha fazla bilet PDF indirilemedi.', 'error'); }
  };

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-16">
      <ConfettiBurst />
      <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}>
        <Card className="relative overflow-hidden"><div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" /><div className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-theater-gold/15 blur-3xl" /><CardContent className="relative p-8 text-center md:p-10"><motion.div initial={{ scale: .4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 14 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-emerald-300/30 bg-emerald-400/15 text-emerald-300 shadow-glow"><CheckCircle2 className="h-12 w-12" /></motion.div><div className="mt-6 flex flex-wrap justify-center gap-3"><p className="flex gap-2 text-sm uppercase tracking-[.32em] text-theater-gold"><Sparkles size={16} /> Bilet hazır</p><ApiModeBadge source={ticketsQuery.data?.source} /></div><h1 className="mt-3 font-serif text-4xl text-white md:text-6xl">Tiyatro gecen hazır</h1><p className="mx-auto mt-4 max-w-2xl text-white/62">Rezervasyon numaran: <span className="text-theater-gold">{visibleBookingNumber}</span>. Bu sayfa gerçek backend biletlerini gösterir.</p><div className="mx-auto mt-7 grid max-w-3xl gap-3 md:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs text-white/45">Bilet</p><strong className="mt-1 block text-xl text-white">{visibleTickets.length}</strong></div><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs text-white/45">Toplam</p><strong className="mt-1 block text-xl text-theater-gold">{money(priceSummary.total || visibleTickets.reduce((sum, ticket) => sum + ticket.price, 0))}</strong></div><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs text-white/45">Durum</p><strong className="mt-1 flex items-center justify-center gap-2 text-xl text-emerald-200"><TicketCheck size={18} /> BACKEND</strong></div></div><div className="mt-7 flex flex-wrap justify-center gap-3"><Button asChild><Link to="/customer/tickets">Biletlerime git</Link></Button><Button variant="outline" onClick={downloadAll} disabled={!visibleTickets.length}><Download size={16} /> Tüm PDF biletleri indir</Button><Button variant="secondary" onClick={printAll} disabled={!visibleTickets.length}><Printer size={16} /> Tümünü yazdır</Button></div></CardContent></Card>
      </motion.div>
      {visibleTickets.length ? <div className="mt-8 grid gap-5 ticket-reveal">{visibleTickets.map((ticket) => <TicketCard ticket={ticket} key={ticket.id} />)}</div> : <div className="mt-8"><EmptyState title="Bilet dönmedi" text="Ödeme başarılı oldu ancak backend bu rezervasyon için henüz bilet döndürmedi." /></div>}
    </main>
  );
}
