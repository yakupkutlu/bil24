import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { QRCodeScanner } from '@/components/tickets/QRCodeScanner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ticketsService } from '@/services/tickets.service';
import type { Ticket } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/ToastProvider';
import { ApiModeBadge } from '@/components/integration/ApiModeBadge';

export function VerifyTicketPage() {
  const { qrToken } = useParams();
  const { showToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [token, setToken] = useState(qrToken ?? '');
  const [ticket, setTicket] = useState<Ticket | undefined>();
  const canMarkUsed = Boolean(user && ['BOX_OFFICE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role));

  const verifyMutation = useMutation({
    mutationFn: (nextToken: string) => ticketsService.verify(nextToken),
    onSuccess: (response, nextToken) => { setToken(nextToken); setTicket(response); showToast('Bilet backend API ile doğrulandı.'); },
    onError: (error) => { setTicket(undefined); showToast(error instanceof Error ? error.message : 'Bilet doğrulama başarısız oldu.', 'error'); }
  });

  const markUsedMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsService.markUsed(ticketId),
    onSuccess: (response) => { setTicket(response); showToast('Bilet backend API ile kullanıldı olarak işaretlendi.'); },
    onError: (error) => showToast(error instanceof Error ? error.message : 'Bilet kullanıldı olarak işaretlenemedi.', 'error')
  });

  useEffect(() => { if (qrToken) verifyMutation.mutate(qrToken); }, [qrToken]);
  const verify = (nextToken: string) => verifyMutation.mutate(nextToken);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[.9fr_1.1fr]">
      <QRCodeScanner onScan={verify} />
      <Card><CardContent className="space-y-5 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm uppercase tracking-[.28em] text-theater-gold">Bilet doğrulama</p><h1 className="mt-2 font-serif text-4xl text-white">Bilet doğrulama</h1></div><ApiModeBadge source="api" /></div>{verifyMutation.isPending && <p className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-white/55">Checking QR token with backend...</p>}{ticket ? <div className="space-y-5"><div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5"><div className="flex flex-wrap items-center gap-3"><Badge>{ticket.status}</Badge><span className="text-sm text-white/45">{ticket.ticketNumber}</span></div><p className="mt-4 flex items-center gap-2 text-xl font-semibold text-emerald-100"><CheckCircle2 /> {ticket.status === 'VALID' ? 'Geçerli bilet' : `Bilet durumu: ${ticket.status}`}</p></div><div className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/[.035] p-5 text-white/65 sm:grid-cols-2"><p><span className="block text-xs uppercase tracking-[.2em] text-white/35">Etkinlik</span>{typeof ticket.event !== 'string' ? ticket.event.title : ticket.event}</p><p><span className="block text-xs uppercase tracking-[.2em] text-white/35">Koltuk</span>{ticket.seatCode} · {ticket.category}</p><p><span className="block text-xs uppercase tracking-[.2em] text-white/35">QR token</span><span className="break-all">{ticket.qrToken}</span></p><p><span className="block text-xs uppercase tracking-[.2em] text-white/35">Backend işlemi</span>POST /api/tickets/verify</p></div>{canMarkUsed ? <Button disabled={ticket.status !== 'VALID' || markUsedMutation.isPending} onClick={() => markUsedMutation.mutate(ticket.id)}>{markUsedMutation.isPending ? 'İşaretleniyor...' : 'Giriş yapıldı olarak işaretle'}</Button> : <p className="flex items-start gap-2 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 text-sm text-yellow-100"><ShieldAlert size={17} /> Genel viewers can verify validity only. Personel/admin roles can mark a ticket as used.</p>}</div> : <p className="rounded-[2rem] border border-red-400/20 bg-red-500/10 p-5 text-red-200">Tara veya enter a real backend QR token.</p>}</CardContent></Card>
    </main>
  );
}
