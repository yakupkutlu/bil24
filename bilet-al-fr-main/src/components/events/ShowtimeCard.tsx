import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, Ticket } from 'lucide-react';
import type { Showtime } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { shortDate } from '@/utils/formatters';

export function ShowtimeCard({ showtime }: { showtime: Showtime }) {
  const hallName = typeof showtime.hall === 'string' ? showtime.hall : showtime.hall.name;
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.25 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-theater-gold/40 hover:bg-white/[.075]"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-theater-gold via-theater-red to-transparent opacity-60" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{showtime.status}</Badge>
            <span className="rounded-full bg-theater-gold/10 px-3 py-1 text-sm text-theater-gold">{shortDate(showtime.date)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/60">
            <span className="flex items-center gap-2"><Clock size={16} />{showtime.startTime}-{showtime.endTime}</span>
            <span className="flex items-center gap-2"><MapPin size={16} />{hallName}</span>
          </div>
        </div>
        <Link to={`/showtimes/${showtime.id}/seats`}>
          <Button variant="gold"><Ticket size={16} /> Koltuk Seç</Button>
        </Link>
      </div>
    </motion.div>
  );
}
