import type { Seat, Showtime } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { money, shortDate } from '@/utils/formatters';
import type { PriceSummary } from '@/stores/booking.store';

const localSummary = (seats: Seat[]): PriceSummary => {
  const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceFee = seats.length ? Math.round(subtotal * .06) : 0;
  const tax = seats.length ? Math.round(subtotal * .10) : 0;
  return { subtotal, serviceFee, tax, discount: 0, total: subtotal + serviceFee + tax };
};

export function CheckoutSummary({ showtime, seats = [], summary }: { showtime?: Showtime; seats?: Seat[]; summary?: PriceSummary }) {
  const price = summary ?? localSummary(seats);
  const event = !showtime ? { title: 'Seans seçilmedi', posterImage: '' } : typeof showtime.event === 'string' ? { title: showtime.event, posterImage: '' } : showtime.event;
  const hall = !showtime ? '-' : typeof showtime.hall === 'string' ? showtime.hall : showtime.hall.name;
  return (
    <Card className="sticky top-24 h-fit overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-theater-red via-theater-gold to-theater-red" />
      <CardContent className="space-y-5 p-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
          <img src={event.posterImage || 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=600&q=80'} alt={event.title} className="h-44 w-full object-cover" />
          <div className="p-4">
            <p className="text-xs uppercase tracking-[.28em] text-theater-gold">Sipariş özeti</p>
            <h3 className="mt-1 font-serif text-2xl text-white">{event.title}</h3>
            <p className="mt-2 text-sm text-white/55">{showtime ? `${shortDate(showtime.date)} · ${showtime.startTime} · ${hall}` : 'Backend müsaitliğine göre koltuk seç'}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {seats.length ? seats.map((seat) => (
            <div key={seat.code} className="flex justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="text-white/80">{seat.code} · {seat.category}</span>
              <span className="text-theater-gold">{money(seat.price)}</span>
            </div>
          )) : <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/45">Koltuk seçimi bekleniyor.</div>}
        </div>

        <div className="space-y-2 border-t border-white/10 pt-4 text-sm text-white/70">
          <div className="flex justify-between"><span>Ara toplam</span><span>{money(price.subtotal)}</span></div>
          <div className="flex justify-between"><span>Servis</span><span>{money(price.serviceFee)}</span></div>
          <div className="flex justify-between"><span>Vergi</span><span>{money(price.tax)}</span></div>
          {price.discount > 0 && <div className="flex justify-between text-emerald-200"><span>İndirim</span><span>-{money(price.discount)}</span></div>}
        </div>
        <div className="flex justify-between rounded-2xl bg-theater-gold/10 p-4 text-lg font-bold text-theater-gold"><span>Toplam</span><span>{money(price.total)}</span></div>
        <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs leading-relaxed text-emerald-100">Ödeme backend /api/payments/checkout endpoint üzerinden işlenir. Canlı backend bağlantısı zorunludur.</p>
      </CardContent>
    </Card>
  );
}
