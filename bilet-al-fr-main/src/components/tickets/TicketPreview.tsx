import { motion } from 'framer-motion';
import { Armchair, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import type { Event, Seat, Showtime } from '@/types';
import { money, shortDate } from '@/utils/formatters';

export function TicketPreview({ event, showtime, seats, total }: { event?: Event; showtime?: Showtime; seats: Seat[]; total: number }) {
  const hall = typeof showtime?.hall === 'string' ? showtime.hall : showtime?.hall?.name;
  return (
    <motion.div initial={{ opacity: 0, rotate: -2, y: 18 }} animate={{ opacity: 1, rotate: 0, y: 0 }} transition={{ duration: .55 }} className="ticket-cut relative overflow-hidden rounded-[2rem] border border-theater-gold/30 bg-gradient-to-br from-theater-red/28 via-white/[.06] to-theater-gold/10 p-5 shadow-strongGlow">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-theater-gold to-transparent" />
      <div className="flex gap-4">
        <img src={event?.posterImage || 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=500&q=80'} alt={event?.title || 'Tiatru bileti'} className="h-36 w-24 rounded-2xl object-cover shadow-xl" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[.22em] text-theater-gold"><Sparkles size={13} /> Bilet preview</p>
          <h3 className="mt-2 font-serif text-3xl leading-none text-white">{event?.title || 'Tiyatro Gecesi'}</h3>
          <div className="mt-4 grid gap-2 text-sm text-white/65">
            <span className="flex items-center gap-2"><CalendarDays size={15} /> {shortDate(showtime?.date)} · {showtime?.startTime || '20:00'}</span>
            <span className="flex items-center gap-2"><MapPin size={15} /> {hall || 'Büyük Sahne'}</span>
            <span className="flex items-center gap-2"><Armchair size={15} /> {seats.map((seat) => seat.code).join(', ') || 'Koltuk seçilmedi'}</span>
          </div>
        </div>
      </div>
      <div className="my-5 border-t border-dashed border-theater-gold/35" />
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[.24em] text-white/40">Toplam</p>
          <p className="mt-1 font-serif text-3xl text-theater-gold">{money(total)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-right">
          <p className="text-xs text-white/45">QR e-ticket</p>
          <p className="mt-1 text-sm text-theater-ivory">Ödeme sonrası hazır</p>
        </div>
      </div>
    </motion.div>
  );
}
