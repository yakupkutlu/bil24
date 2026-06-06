import { motion } from 'framer-motion';
import { Download, ReceiptText, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Booking } from '@/types';
import { dateTime, money } from '@/utils/formatters';

export function OrderExperienceCard({ booking, index = 0 }: { booking: Booking; index?: number }) {
  const showtime = typeof booking.showtime === 'string' ? undefined : booking.showtime;
  const event = showtime && typeof showtime.event !== 'string' ? showtime.event : undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="ticket-cut relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-5 shadow-xl"
    >
      <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-theater-gold/70 to-transparent" />
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{booking.status}</Badge>
            <span className="text-sm text-white/45">{booking.bookingNumber}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[.28em] text-theater-gold">Sipariş story</p>
            <h3 className="mt-1 font-serif text-2xl text-white">{event?.title || 'Tiatru siparişi'}</h3>
            <p className="mt-1 text-sm text-white/55">{dateTime(booking.createdAt)} · {booking.seats.length} ticket(s)</p>
          </div>
          <div className="grid gap-2 text-sm text-white/60 sm:grid-cols-4">
            <span><strong className="block text-white">Ara toplam</strong>{money(booking.subtotal)}</span>
            <span><strong className="block text-white">Service</strong>{money(booking.serviceFee)}</span>
            <span><strong className="block text-white">Tax</strong>{money(booking.tax)}</span>
            <span><strong className="block text-theater-gold">Toplam</strong>{money(booking.total)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 lg:flex-col">
          <Button asChild variant="secondary"><Link to="/customer/tickets"><Ticket size={16} /> Biletler</Link></Button>
          <Button variant="outline"><ReceiptText size={16} /> Invoice</Button>
          <Button variant="ghost"><Download size={16} /> İndir</Button>
        </div>
      </div>
    </motion.article>
  );
}
