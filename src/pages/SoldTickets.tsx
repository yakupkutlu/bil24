import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { ticketsApi, smsApi } from '../lib/api';
import { formatDate, formatTime, formatCurrency } from '../lib/utils';
import type { Ticket, Session, Event, Seat, Hall } from '../types';
import {
  Search, Ticket as TicketIcon, User, Phone, Mail,
  Calendar, MapPin, Tag, X, Clock,
  Download, Printer, MessageSquare, ExternalLink,
} from 'lucide-react';

type TicketWithDetails = Omit<Ticket, 'seat'> & {
  session?: Omit<Session, 'event' | 'hall'> & { event?: Event; hall?: Hall };
  seat?: Seat;
};

const STATUS_LABEL: Record<string, string> = {
  active:    'Aktif',
  used:      'Kullanıldı',
  cancelled: 'İptal',
  expired:   'Süresi Doldu',
};

const STATUS_COLOR: Record<string, string> = {
  active:    'bg-green-100 text-green-700 border-green-200',
  used:      'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  expired:   'bg-gray-100 text-gray-600 border-gray-200',
};

const RULES = [
  'Bu bilet etkinlik girişlerini kontrol etmek amacıyla dijital olarak üretilmiştir.',
  'Etkinliğin taahhüt edildiği gibi gerçekleşmesinden organizatör sorumludur.',
  'Satılan biletler nakde çevrilemez, iade alınamaz, devredilemez ve iptal edilemez.',
  'Etkinlik süresi boyunca biletinizi muhafaza ediniz.',
  'Bilet kaybı, kopyalanması vb. durumlarda herhangi bir sorumluluk kabul edilmez.',
  'Bu biletin mali bir değeri yoktur; mali değeri bulunan belgeleri organizatörden alabilirsiniz.',
  'Organizatör etkinlik programında değişiklik yapma hakkını saklı tutar.',
];

const DEFAULT_COUNT = 5;

// ─── Yazdır / İndir yardımcıları ─────────────────────────────────────────────

async function getQRDataUrl(qrData: string): Promise<string> {
  return QRCode.toDataURL(qrData, { width: 300, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
}

function buildPrintHtml(ticket: TicketWithDetails, qrDataUrl: string): string {
  const t = ticket as any;
  const sDate  = ticket.session?.session_date ? new Date(ticket.session.session_date as string) : null;
  const day    = sDate?.getDate() ?? '';
  const month  = sDate ? sDate.toLocaleDateString('tr-TR', { month: 'long' }) : '';
  const year   = sDate?.getFullYear() ?? '';
  const dayName = sDate ? sDate.toLocaleDateString('tr-TR', { weekday: 'long' }) : '';
  const time   = ticket.session?.start_time ? (ticket.session.start_time as string).slice(0, 5) : '';
  const price  = formatCurrency(Number(ticket.total_amount));
  const qrImg  = qrDataUrl
    ? `<img src="${qrDataUrl}" alt="QR" width="130" height="130" />`
    : `<div style="width:130px;height:130px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:11px;color:#aaa;text-align:center;">QR</div>`;
  const rulesHtml = RULES.map(r => `<li>${r}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"><title>Bilet — ${ticket.ticket_code}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;background:#f0f0f0;padding:24px;color:#222}
  .page{max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.12)}
  .ticket{display:flex;border-bottom:2px dashed #ddd}
  .t-left{background:#f8f8f8;border-right:2px dashed #ccc;padding:24px 20px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:180px;gap:12px}
  .pnr-lbl{font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:1px;text-align:center;margin-top:4px}
  .pnr-val{font-family:monospace;font-size:11px;font-weight:bold;color:#555;text-align:center}
  .t-right{flex:1;padding:22px 24px;display:flex;flex-direction:column;justify-content:space-between}
  .ev-title{font-size:19px;font-weight:bold;color:#111;line-height:1.2;margin-bottom:4px}
  .cust-name{font-size:15px;font-weight:700;color:#f97316;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;border-top:1px solid #eee;padding-top:12px}
  .lbl{font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
  .day-num{font-size:30px;font-weight:bold;color:#111;line-height:1}
  .month{font-size:11px;color:#666;margin-top:3px}
  .badge{display:inline-block;background:#f97316;color:#fff;font-size:12px;font-weight:bold;padding:4px 14px;border-radius:20px;margin-top:2px}
  .val{font-size:12px;font-weight:500;color:#444}
  .price-row{display:flex;justify-content:flex-end;border-top:1px solid #eee;padding-top:10px;margin-top:12px}
  .price-val{font-size:22px;font-weight:bold;color:#111;text-align:right}
  .rules{padding:18px 24px 22px}
  .rules-title{font-size:13px;font-weight:bold;background:#1d4ed8;color:#fff;display:inline-block;padding:5px 14px;border-radius:5px;margin-bottom:12px}
  .rules ul{list-style:none;padding:0}
  .rules li{font-size:11px;color:#555;line-height:1.65;padding:2px 0}
  .rules li::before{content:"— "}
  @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0}}
</style></head><body>
<div class="page">
  <div class="ticket">
    <div class="t-left">${qrImg}<div class="pnr-lbl">PNR</div><div class="pnr-val">${ticket.ticket_code}</div></div>
    <div class="t-right">
      <div>
        <div class="ev-title">${ticket.session?.event?.title ?? '—'}</div>
        <div class="cust-name">${ticket.customer_name}</div>
        <div class="grid">
          <div><div class="lbl">Tarih</div><div class="day-num">${day}</div><div class="month">${month} ${year} · ${dayName}</div></div>
          <div><div class="lbl">Saat</div><span class="badge">${time}</span></div>
          <div><div class="lbl">Salon</div><div class="val">📍 ${ticket.session?.hall?.name ?? '—'}</div></div>
          ${ticket.seat?.seat_label ? `<div><div class="lbl">Koltuk</div><div class="val">🎫 ${ticket.seat.seat_label}</div></div>` : ''}
        </div>
      </div>
      <div class="price-row"><div><div class="lbl">Bilet Fiyatı</div><div class="price-val">${price}</div></div></div>
    </div>
  </div>
  <div class="rules">
    <div class="rules-title">Kurallar</div>
    <ul>${rulesHtml}</ul>
  </div>
</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;
}

// ─── Bilet Kartı ─────────────────────────────────────────────────────────────

function TicketCard({ ticket }: { ticket: TicketWithDetails }) {
  const t = ticket as any;
  const navigate = useNavigate();
  const [smsState, setSmsState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [smsMsg,   setSmsMsg]   = useState('');

  const handlePrint = async () => {
    try {
      const qrDataUrl = ticket.qr_code_data ? await getQRDataUrl(ticket.qr_code_data) : '';
      const win = window.open('', '', 'width=800,height=700');
      if (!win) return;
      win.document.write(buildPrintHtml(ticket, qrDataUrl));
      win.document.close();
    } catch { /* ignore */ }
  };

  const handleDownload = async () => {
    if (!ticket.qr_code_data) return;
    try {
      const qrDataUrl = await getQRDataUrl(ticket.qr_code_data);
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `qr-${ticket.ticket_code}.png`;
      link.click();
    } catch { /* ignore */ }
  };

  const handleSms = async () => {
    if (!ticket.id) return;
    setSmsState('sending');
    setSmsMsg('');
    try {
      const result = await smsApi.send(ticket.id);
      if (result.success) {
        setSmsState('ok');
        setSmsMsg('SMS gönderildi');
      } else {
        setSmsState('err');
        setSmsMsg(result.error ?? 'SMS gönderilemedi');
      }
    } catch (err) {
      setSmsState('err');
      setSmsMsg(err instanceof Error ? err.message : 'SMS gönderilemedi');
    }
    setTimeout(() => { setSmsState('idle'); setSmsMsg(''); }, 5000);
  };

  const handleDigitalTicket = () => {
    window.open(`/bilet/${ticket.ticket_code}`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

      {/* Üst şerit */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar size={14} className="text-blue-500 flex-shrink-0" />
          <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {ticket.session?.event?.title || '—'}
          </span>
          {ticket.session && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatDate(ticket.session.session_date as string)}
              {' '}
              <Clock size={11} className="inline mb-0.5" />
              {' '}
              {formatTime(ticket.session.start_time as string)}
            </span>
          )}
        </div>
        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLOR[ticket.status] ?? STATUS_COLOR.expired}`}>
          {STATUS_LABEL[ticket.status] ?? ticket.status}
        </span>
      </div>

      {/* İçerik: 2 kolon */}
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <div className="space-y-2">
          <InfoRow icon={<User size={14} className="text-blue-400" />} label="Ad Soyad" value={ticket.customer_name || '—'} />
          <InfoRow icon={<Phone size={14} className="text-green-400" />} label="Telefon" value={t.customer_phone || '—'} mono />
          <InfoRow icon={<Mail size={14} className="text-purple-400" />} label="E-posta" value={t.customer_email || '—'} mono />
        </div>
        <div className="space-y-2">
          {ticket.session?.hall?.name && (
            <InfoRow icon={<MapPin size={14} className="text-orange-400" />} label="Salon" value={ticket.session.hall.name} />
          )}
          {ticket.seat?.seat_label && (
            <InfoRow icon={<TicketIcon size={14} className="text-indigo-400" />} label="Koltuk" value={ticket.seat.seat_label} />
          )}
          {ticket.total_amount != null && (
            <InfoRow icon={<Tag size={14} className="text-yellow-500" />} label="Tutar" value={formatCurrency(Number(ticket.total_amount))} bold />
          )}
        </div>
      </div>

      {/* Aksiyon butonları */}
      <div className="px-5 pb-4">
        <div className="flex flex-wrap gap-2">
          {/* İndir */}
          <button onClick={handleDownload}
            title="QR kod PNG olarak indir"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition">
            <Download size={13} /> İndir
          </button>

          {/* Yazdır */}
          <button onClick={handlePrint}
            title="Bileti yazdır"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition">
            <Printer size={13} /> Yazdır
          </button>

          {/* Dijital Bilet */}
          <button onClick={handleDigitalTicket}
            title="Dijital bileti yeni sekmede aç"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-medium transition">
            <ExternalLink size={13} /> Dijital Bilet
          </button>

          {/* SMS Gönder */}
          <button onClick={handleSms}
            disabled={smsState === 'sending'}
            title={t.customer_phone ? 'SMS ile dijital bilet linki gönder' : 'Telefon numarası yok'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              smsState === 'ok'
                ? 'border-green-300 text-green-700 bg-green-50'
                : smsState === 'err'
                ? 'border-red-300 text-red-600 bg-red-50'
                : smsState === 'sending'
                ? 'border-gray-200 text-gray-400 cursor-wait'
                : t.customer_phone
                ? 'border-green-300 text-green-700 hover:bg-green-50'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
            }`}>
            {smsState === 'sending'
              ? <><span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Gönderiliyor...</>
              : <><MessageSquare size={13} /> SMS Gönder</>}
          </button>
        </div>

        {/* SMS durum mesajı */}
        {smsMsg && (
          <p className={`mt-2 text-xs ${smsState === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
            {smsMsg}
          </p>
        )}
      </div>

      {/* Alt şerit */}
      <div className="px-5 py-2.5 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <span className="font-mono font-semibold tracking-wide text-gray-600 dark:text-gray-300">
          {ticket.ticket_code}
        </span>
        {ticket.created_at && (
          <span>
            {new Date(ticket.created_at).toLocaleString('tr-TR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function SoldTickets() {
  const [tickets,  setTickets]  = useState<TicketWithDetails[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [query,    setQuery]    = useState('');

  useEffect(() => {
    ticketsApi.list()
      .then(data => setTickets((data as unknown as TicketWithDetails[]) || []))
      .catch(() => setError('Biletler yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...tickets].sort((a, b) =>
      new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    ),
    [tickets]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted.slice(0, DEFAULT_COUNT);
    return sorted.filter(t =>
      t.customer_name?.toLowerCase().includes(q) ||
      (t as any).customer_phone?.toLowerCase().includes(q) ||
      (t as any).customer_email?.toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const isSearching = query.trim().length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Başlık + Arama */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Satılan Biletler</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isSearching
              ? `"${query}" için ${filtered.length} sonuç bulundu`
              : `Son ${Math.min(DEFAULT_COUNT, sorted.length)} satış — toplam ${sorted.length} bilet`}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ad, telefon veya e-posta..."
            className="w-full pl-9 pr-9 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <TicketIcon className="w-14 h-14 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {sorted.length === 0 ? 'Henüz hiç bilet satılmamış.' : 'Bu arama kriterine uyan bilet bulunamadı.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
      </div>

      {!isSearching && sorted.length > DEFAULT_COUNT && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 pt-2">
          Tüm biletleri görmek için ad, telefon veya e-posta ile arama yapın.
        </p>
      )}
    </div>
  );
}

// ─── Yardımcı ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon, label, value, mono = false, bold = false,
}: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-xs text-gray-400 w-16 flex-shrink-0">{label}</span>
      <span className={`text-sm truncate ${bold ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
