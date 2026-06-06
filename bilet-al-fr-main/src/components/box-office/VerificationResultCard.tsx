import { AlertTriangle, CheckCircle2, CircleOff, TicketCheck, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Ticket } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { dateTime } from '@/utils/formatters';

export function VerificationResultCard({ ticket, onMarkUsed }: { ticket?: Ticket; onMarkUsed: () => void }) {
  if (!ticket) {
    return (
      <Card className="border-red-400/20">
        <CardContent className="grid min-h-[360px] place-items-center p-8 text-center">
          <div className="space-y-4">
            <CircleOff className="mx-auto text-red-300" size={54} />
            <h2 className="font-serif text-4xl text-white">Bilet bulunamadı</h2>
            <p className="max-w-md text-white/55">Bu QR token ile eşleşen bilet yok. Misafirden hesabındaki QR kodu göstermesini isteyin veya bilet numarasıyla arayın.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const event = typeof ticket.event === 'string' ? undefined : ticket.event;
  const showtime = typeof ticket.showtime === 'string' ? undefined : ticket.showtime;
  const hall = typeof ticket.hall === 'string' ? undefined : ticket.hall;
  const isValid = ticket.status === 'VALID';
  const isUsed = ticket.status === 'USED';

  return (
    <motion.div key={ticket.ticketNumber + ticket.status} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={isValid ? 'border-green-400/25' : 'border-red-400/25'}>
        <CardContent className="space-y-6 p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[.28em] text-theater-gold">Giriş sonucu</p>
              <h2 className="mt-2 font-serif text-4xl text-white">{isValid ? 'İçeri hoş geldiniz' : isUsed ? 'Zaten giriş yapmış' : 'İçeri alma'}</h2>
            </div>
            <Badge>{ticket.status}</Badge>
          </div>

          <div className="grid gap-4 rounded-3xl border border-white/10 bg-black/25 p-5 sm:grid-cols-2">
            <div><span className="text-xs text-white/35">Bilet</span><strong className="block text-white">{ticket.ticketNumber}</strong></div>
            <div><span className="text-xs text-white/35">Koltuk</span><strong className="block text-theater-gold">{ticket.seatCode} · {ticket.category}</strong></div>
            <div><span className="text-xs text-white/35">Etkinlik</span><strong className="block text-white">{event?.title || 'Etkinlik'}</strong></div>
            <div><span className="text-xs text-white/35">Seans</span><strong className="block text-white">{showtime?.startTime || '20:00'} · {hall?.name || 'Salon'}</strong></div>
          </div>

          {isUsed && (
            <div className="flex items-start gap-3 rounded-3xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
              <AlertTriangle className="mt-0.5" size={18} /> Bu bilet zaten kullanıldı olarak işaretlenmiş {ticket.usedAt ? `şu tarihte: ${dateTime(ticket.usedAt)}` : 'daha önce'}. Çift giriş engellendi.
            </div>
          )}

          {isValid ? (
            <Button className="w-full" onClick={onMarkUsed}><UserCheck size={17} /> Giriş yapıldı olarak işaretle</Button>
          ) : (
            <Button className="w-full" variant="outline" disabled><AlertTriangle size={17} /> Giriş engellendi</Button>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/55"><CheckCircle2 className="mb-2 text-green-300" size={18} /> QR imzası kontrol edildi</div>
            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/55"><TicketCheck className="mb-2 text-theater-gold" size={18} /> Durum bilet kaydıyla senkronize edildi</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
