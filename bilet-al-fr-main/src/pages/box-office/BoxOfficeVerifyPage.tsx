import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { History, ScanLine } from 'lucide-react';
import { VerificationResultCard } from '@/components/box-office/VerificationResultCard';
import { QRCodeScanner } from '@/components/tickets/QRCodeScanner';
import { Card, CardContent } from '@/components/ui/Card';
import type { Ticket } from '@/types';
import { dateTime } from '@/utils/formatters';
import { boxOfficeService } from '@/services/boxOffice.service';
import { useToast } from '@/components/ui/ToastProvider';
import { ApiModeBadge } from '@/components/integration/ApiModeBadge';

export function BoxOfficeVerifyPage() {
  const { showToast } = useToast();
  const [manualToken, setManualToken] = useState('');
  const [ticket, setTicket] = useState<Ticket | undefined>();
  const [scanLog, setScanLog] = useState<Array<{ token: string; status: string; time: string }>>([]);

  const verifyMutation = useMutation({
    mutationFn: (nextToken: string) => boxOfficeService.verifyTicket(nextToken),
    onSuccess: (ticketResponse, nextToken) => { setTicket(ticketResponse); setManualToken(nextToken); setScanLog((current) => [{ token: nextToken, status: ticketResponse.status, time: new Date().toISOString() }, ...current].slice(0, 6)); showToast('Bilet backend API ile doğrulandı.'); },
    onError: (error, nextToken) => { setTicket(undefined); setScanLog((current) => [{ token: nextToken, status: 'NOT_FOUND', time: new Date().toISOString() }, ...current].slice(0, 6)); showToast(error instanceof Error ? error.message : 'Backend doğrulaması başarısız oldu.', 'error'); }
  });

  const markUsedMutation = useMutation({
    mutationFn: (ticketId: string) => boxOfficeService.markTicketUsed(ticketId),
    onSuccess: (ticketResponse) => { setTicket(ticketResponse); showToast('Bilet backend API ile kullanıldı olarak işaretlendi.'); },
    onError: (error) => showToast(error instanceof Error ? error.message : 'Bilet kullanıldı olarak işaretlenemedi.', 'error')
  });

  const scan = (nextToken: string) => verifyMutation.mutate(nextToken);
  const markUsed = () => { if (ticket?.status === 'VALID') markUsedMutation.mutate(ticket.id); };

  return (
    <main className="space-y-6"><motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3"><p className="text-sm uppercase tracking-[.28em] text-theater-gold">QR gate verification</p></div><h1 className="font-serif text-5xl text-white">Tara. Confirm. Let the story begin.</h1></div></motion.header>
      <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]"><div className="space-y-5"><QRCodeScanner onScan={scan} /></div><div className="space-y-5"><VerificationResultCard ticket={ticket} onMarkUsed={markUsed} /><Card><CardContent className="space-y-4 p-6"><p className="flex items-center gap-2 text-xs uppercase tracking-[.28em] text-theater-gold"><History size={15} /> Recent gate scans</p><div className="space-y-2">{scanLog.length ? scanLog.map((item, index) => <div key={item.token + item.time + index} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm"><span className="text-white/70">{item.token}</span><span className={item.status === 'VALID' ? 'text-green-200' : item.status === 'USED' ? 'text-blue-200' : 'text-red-200'}>{item.status}</span><span className="hidden text-xs text-white/35 sm:inline">{dateTime(item.time)}</span></div>) : <p className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-white/45">No scans yet.</p>}</div></CardContent></Card></div></section>
    </main>
  );
}
