import { CalendarClock, CircleDot, DoorOpen, UsersRound } from 'lucide-react';
import type { Showtime } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { shortDate } from '@/utils/formatters';

export function LiveShowRunCard({ showtime, sold = 128, capacity = 240 }: { showtime: Showtime; sold?: number; capacity?: number }) {
  const event = typeof showtime.event === 'string' ? undefined : showtime.event;
  const hall = typeof showtime.hall === 'string' ? undefined : showtime.hall;
  const occupancy = Math.round((sold / capacity) * 100);

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-5 p-5 md:grid-cols-[150px_1fr_auto] md:items-center">
        <div className="relative h-40 overflow-hidden rounded-3xl md:h-28">
          {event?.posterImage && <img src={event.posterImage} alt={event.title} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-full bg-theater-gold px-3 py-1 text-xs font-bold text-theater-black">{showtime.startTime}</span>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2"><Badge>{showtime.status}</Badge><span className="text-xs text-white/45">{shortDate(showtime.date)}</span></div>
          <h3 className="font-serif text-2xl text-white">{event?.title || 'Seans'}</h3>
          <div className="grid gap-2 text-sm text-white/55 sm:grid-cols-3">
            <span className="flex items-center gap-2"><DoorOpen size={15} className="text-theater-gold" /> {hall?.name || 'Salon'}</span>
            <span className="flex items-center gap-2"><UsersRound size={15} className="text-theater-gold" /> {sold}/{capacity} koltuk</span>
            <span className="flex items-center gap-2"><CalendarClock size={15} className="text-theater-gold" /> Kapılar 19:30</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-theater-gold to-theater-red" style={{ width: `${occupancy}%` }} />
          </div>
        </div>
        <div className="flex flex-col gap-2 md:min-w-36">
          <Button size="sm">Koltuk sat</Button>
          <Button size="sm" variant="outline">Giriş ekranı</Button>
        </div>
      </CardContent>
    </Card>
  );
}
