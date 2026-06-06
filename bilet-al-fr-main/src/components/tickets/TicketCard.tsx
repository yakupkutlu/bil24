import { motion } from 'framer-motion';
import { Calendar, MapPin, Armchair, ShieldCheck } from 'lucide-react';
import type { Ticket } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { QRCodeCard } from './QRCodeCard';
import { TicketActionButtons } from './TicketActionButtons';
import { dateTime, money } from '@/utils/formatters';

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const event = typeof ticket.event === 'string' ? { title: ticket.event, posterImage: '' } : ticket.event;
  const showtime = typeof ticket.showtime === 'string' ? undefined : ticket.showtime;
  const hall = typeof ticket.hall === 'string' ? ticket.hall : ticket.hall.name;
  return (
    <motion.article initial={{ opacity: 0, y: 24, rotateX: -8 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true }} transition={{ duration: .55 }} className="ticket-cut relative grid gap-5 overflow-hidden rounded-[2rem] border border-theater-gold/25 bg-gradient-to-br from-white/12 via-white/[0.055] to-theater-gold/5 p-5 shadow-strongGlow md:grid-cols-[170px_1fr_auto]">
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-theater-gold/70 to-transparent" />
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-theater-gold/15 blur-3xl" />
      <img src={event.posterImage || 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=400&q=80'} alt={event.title} className="relative h-52 w-full rounded-2xl object-cover shadow-xl md:h-full" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2"><Badge>{ticket.status}</Badge><span className="text-sm text-white/50">{ticket.ticketNumber}</span><span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100"><ShieldCheck size={13} className="mr-1 inline" /> QR aktif</span></div>
        <div><p className="text-xs uppercase tracking-[.28em] text-theater-gold">E-ticket</p><h3 className="mt-1 font-serif text-3xl font-semibold text-white md:text-4xl">{event.title}</h3></div>
        <div className="grid gap-2 text-sm text-white/60 md:grid-cols-2">
          <span className="flex items-center gap-2"><Calendar size={16} />{dateTime(showtime?.date)}</span>
          <span className="flex items-center gap-2"><MapPin size={16} />{hall}</span>
          <span className="flex items-center gap-2"><Armchair size={16} />Koltuk {ticket.seatCode} · {ticket.category}</span>
          <span className="text-theater-gold">{money(ticket.price)}</span>
        </div>
        <TicketActionButtons ticket={ticket} />
      </div>
      <div className="relative flex items-center justify-center"><QRCodeCard token={ticket.qrToken} /></div>
    </motion.article>
  );
}
