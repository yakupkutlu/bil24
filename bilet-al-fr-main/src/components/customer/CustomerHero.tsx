import { motion } from 'framer-motion';
import { CalendarDays, Heart, Sparkles, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import type { Ticket as TicketType } from '@/types';
import { dateTime } from '@/utils/formatters';

export function CustomerHero({ fullName, nextTicket }: { fullName?: string; nextTicket?: TicketType }) {
  const event = nextTicket && typeof nextTicket.event !== 'string' ? nextTicket.event : undefined;
  const showtime = nextTicket && typeof nextTicket.showtime !== 'string' ? nextTicket.showtime : undefined;

  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65 }}
      className="relative overflow-hidden rounded-[2rem] border border-theater-gold/25 bg-gradient-to-br from-theater-red/35 via-white/[0.055] to-theater-gold/10 p-6 shadow-strongGlow md:p-8"
    >
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-theater-gold/20 blur-3xl" />
      <div className="absolute left-8 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-theater-gold/70 to-transparent" />
      <div className="absolute inset-0 curtain-folds opacity-35" />
      <div className="relative grid gap-8 lg:grid-cols-[1.35fr_.75fr] lg:items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-theater-gold/25 bg-black/25 px-4 py-2 text-sm text-theater-ivory">
            <Sparkles size={16} className="text-theater-gold" />
            Your personal theater journey
          </div>
          <div>
            <p className="text-theater-gold">Welcome back{fullName ? `, ${fullName.split(' ')[0]}` : ''}</p>
            <h1 className="mt-2 max-w-3xl font-serif text-4xl font-semibold leading-tight text-white md:text-6xl">
              The curtain is almost open for your next memory.
            </h1>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-white/68">
            Track your tickets, reservations, orders, and refunds in one elegant place — designed to feel like your private balcony at Tiatru.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/events"><Ticket size={18} /> Discover shows</Link></Button>
            <Button asChild variant="outline" size="lg"><Link to="/customer/tickets">Biletlerim</Link></Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, rotate: 4, y: 18 }}
          animate={{ opacity: 1, rotate: -1.5, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="ticket-cut relative rounded-[1.75rem] border border-theater-gold/30 bg-black/35 p-5 shadow-strongGlow"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-theater-gold px-3 py-1 text-xs font-bold text-theater-black">NEXT TICKET</span>
            <Heart size={18} className="text-theater-gold" />
          </div>
          <div className="space-y-4">
            <img
              src={event?.posterImage || 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=600&q=80'}
              alt={event?.title || 'Tiatru bileti'}
              className="h-44 w-full rounded-2xl object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[.28em] text-theater-gold">Tonight feeling</p>
              <h2 className="mt-1 font-serif text-2xl text-white">{event?.title || 'Sonraki oyununu seç'}</h2>
            </div>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
              <span className="flex items-center gap-2"><CalendarDays size={16} className="text-theater-gold" />{dateTime(showtime?.date)}</span>
              <span>Koltuk {nextTicket?.seatCode || '—'} · {nextTicket?.category || 'VIP / Standart / Öğrenci'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
