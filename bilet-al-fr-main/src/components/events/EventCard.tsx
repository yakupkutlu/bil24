import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Languages, Sparkles } from 'lucide-react';
import type { Event } from '@/types';
import { money } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function EventCard({ event, featured = false }: { event: Event; featured?: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-xl backdrop-blur transition hover:border-theater-gold/60 hover:shadow-strongGlow"
    >
      <div className="absolute inset-x-6 top-0 z-10 h-px bg-gradient-to-r from-transparent via-theater-gold/70 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className={featured ? 'relative h-[410px] overflow-hidden' : 'relative h-80 overflow-hidden'}>
        <img src={event.posterImage} alt={event.title} className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,232,199,.18),transparent_28%)] opacity-0 transition duration-500 group-hover:opacity-100" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge>{event.category}</Badge>
          <span className="rounded-full border border-theater-gold/30 bg-black/45 px-3 py-1 text-xs text-theater-ivory backdrop-blur">Tonight mood</span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[.26em] text-theater-gold"><Sparkles size={14} /> Canlı stage</p>
          <h3 className="font-serif text-3xl font-bold text-white drop-shadow">{event.title}</h3>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <p className="line-clamp-2 text-sm leading-6 text-white/62">{event.shortDescription}</p>
        <div className="grid gap-2 text-xs text-white/55 sm:grid-cols-3">
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-2"><Clock size={14} />{event.durationMinutes} dk</span>
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-2"><Languages size={14} />{event.language}</span>
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-2"><Calendar size={14} />{event.ageLimit}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="block text-xs text-white/45">Başlayan fiyat</span>
            <span className="font-semibold text-theater-gold">{money(event.priceFrom ?? 0)}</span>
          </div>
          <Link to={`/events/${event.slug}`}><Button variant="gold">Perdeye yaklaş</Button></Link>
        </div>
      </div>
    </motion.article>
  );
}
