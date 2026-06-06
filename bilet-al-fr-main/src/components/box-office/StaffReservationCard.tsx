import { Clock3, CreditCard, Phone, TimerReset, Trash2, UserRound } from 'lucide-react';
import type { Booking } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { dateTime, money } from '@/utils/formatters';

export function StaffReservationCard({ booking, onConfirm, onExtend, onCancel }: { booking: Booking; onConfirm: () => void; onExtend: () => void; onCancel: () => void }) {
  const user = typeof booking.user === 'string' ? undefined : booking.user;
  const showtime = typeof booking.showtime === 'string' ? undefined : booking.showtime;
  const event = showtime && typeof showtime.event !== 'string' ? showtime.event : undefined;

  return (
    <Card>
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2"><Badge>{booking.status}</Badge><span className="text-xs text-white/40">{booking.bookingNumber}</span></div>
          <div>
            <h3 className="font-serif text-2xl text-white">{event?.title || 'Rezerve edilen oyun'}</h3>
            <p className="mt-1 text-sm text-white/50">{showtime?.startTime || '20:00'} · Koltuklar {booking.seats.map((seat) => seat.seatCode).join(', ')}</p>
          </div>
          <div className="grid gap-2 text-sm text-white/55 sm:grid-cols-3">
            <span className="flex items-center gap-2"><UserRound size={15} className="text-theater-gold" /> {user?.fullName || 'Gişe misafiri'}</span>
            <span className="flex items-center gap-2"><Phone size={15} className="text-theater-gold" /> {user?.phone || '+90 555 000 0000'}</span>
            <span className="flex items-center gap-2"><Clock3 size={15} className="text-theater-gold" /> {booking.expiresAt ? dateTime(booking.expiresAt) : 'Süre sınırı yok'}</span>
          </div>
        </div>
        <div className="space-y-3 lg:min-w-64">
          <div className="rounded-2xl border border-theater-gold/20 bg-theater-gold/10 p-4 text-center">
            <span className="text-xs uppercase tracking-[.24em] text-white/35">Tutar</span>
            <strong className="block text-2xl text-theater-gold">{money(booking.total)}</strong>
          </div>
          <div className="grid grid-cols-3 gap-2">
            { booking.status != `PAID` &&  <Button size="sm" onClick={onConfirm}><CreditCard size={15} /> Öde</Button>}
            <Button size="sm" variant="outline" onClick={onExtend}><TimerReset size={15} /></Button>
            <Button size="sm" variant="danger" onClick={onCancel}><Trash2 size={15} /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
