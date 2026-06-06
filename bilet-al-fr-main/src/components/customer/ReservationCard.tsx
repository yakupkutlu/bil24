import { motion } from 'framer-motion';
import { Clock3, Ticket, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Booking } from '@/types';
import { dateTime, money } from '@/utils/formatters';

export function ReservationCard({ booking, index = 0 }: { booking: Booking; index?: number }) {
  const showtime = typeof booking.showtime === 'string' ? undefined : booking.showtime;
  const event = showtime && typeof showtime.event !== 'string' ? showtime.event : undefined;
  const expires = booking.expiresAt ? new Date(booking.expiresAt) : new Date(Date.now() + 9 * 60 * 1000);
  const minutes = Math.max(0, Math.round((expires.getTime() - Date.now()) / 60000));

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative overflow-hidden rounded-[1.75rem] border border-theater-gold/20 bg-gradient-to-br from-white/10 via-white/[0.045] to-theater-red/10 p-5 shadow-xl"
    >
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-theater-gold/10 blur-3xl" />
      <div className="relative grid gap-5 md:grid-cols-[130px_1fr_auto] md:items-center">
        <img src={event?.posterImage || 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?auto=format&fit=crop&w=500&q=80'} alt={event?.title || 'Rezervasyon'} className="h-40 w-full rounded-2xl object-cover md:h-32" />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2"><Badge>{booking.status}</Badge><span className="text-sm text-white/45">{booking.bookingNumber}</span></div>
          <div>
            <h3 className="font-serif text-2xl text-white">{event?.title || 'Rezerve koltuklar'}</h3>
            <p className="mt-1 text-sm text-white/55">{dateTime(showtime?.date)} · {booking.seats.map((s) => s.seatCode).join(', ')}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-theater-gold/25 bg-theater-gold/10 px-3 py-1 text-theater-ivory"><Clock3 size={14} className="mr-1 inline text-theater-gold" />{minutes} min left</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">{money(booking.total)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 md:flex-col">
          <Button asChild><Link to="/checkout"><Ticket size={16} /> Öde now</Link></Button>
          <Button variant="outline"><XCircle size={16} /> İptal</Button>
        </div>
      </div>
    </motion.article>
  );
}
