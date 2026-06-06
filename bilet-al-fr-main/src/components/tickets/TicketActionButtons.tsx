import { useState } from 'react';
import { Download, Mail, Printer, ShieldCheck, Copy } from 'lucide-react';
import type { Ticket } from '@/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { ticketsService } from '@/services/tickets.service';
import { printTickets } from '@/utils/ticketPrint';

export function TicketActionButtons({ ticket, compact = false }: { ticket: Ticket; compact?: boolean }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<'download' | 'email' | 'print' | 'copy' | undefined>();

  const download = async () => {
    setBusy('download');
    try {
      await ticketsService.downloadPdf(ticket);
      showToast('Bilet PDF’i backendden indirildi.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Bilet PDF indirme başarısız oldu.', 'error');
    } finally {
      setBusy(undefined);
    }
  };

  const resend = async () => {
    setBusy('email');
    try {
      await ticketsService.resendEmail(ticket.id);
      showToast('Bilet e-postası tekrar gönderme isteği gönderildi.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Bilet e-postası tekrar gönderilemedi.', 'error');
    } finally {
      setBusy(undefined);
    }
  };

  const print = () => {
    setBusy('print');
    try {
      printTickets([ticket], ticket.ticketNumber);
      showToast('Yazdırma penceresi açıldı.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Yazdırma penceresi açılamadı.', 'error');
    } finally {
      setBusy(undefined);
    }
  };

  const copyLink = async () => {
    setBusy('copy');
    try {
      const url = `${window.location.origin}/verify-ticket/${encodeURIComponent(ticket.qrToken)}`;
      await navigator.clipboard.writeText(url);
      showToast('Doğrulama bağlantısı kopyalandı.');
    } catch {
      showToast('Doğrulama bağlantısı kopyalanamadı.', 'error');
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" size="sm" onClick={download} disabled={busy === 'download'}>
        <Download size={15} /> {busy === 'download' ? 'İndiriliyor...' : compact ? 'PDF' : 'PDF İndir'}
      </Button>
      <Button variant="outline" size="sm" onClick={print} disabled={busy === 'print'}>
        <Printer size={15} /> {compact ? 'Yazdır' : 'Yazdır'}
      </Button>
      <Button variant="outline" size="sm" onClick={resend} disabled={busy === 'email'}>
        <Mail size={15} /> {compact ? 'E-posta' : 'E-posta gönder'}
      </Button>
      <Button variant="ghost" size="sm" onClick={copyLink} disabled={busy === 'copy'}>
        {busy === 'copy' ? <ShieldCheck size={15} /> : <Copy size={15} />} {compact ? 'Link' : 'Doğrulama bağlantısı'}
      </Button>
    </div>
  );
}
