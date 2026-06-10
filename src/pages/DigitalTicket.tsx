import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { fetchPublicTicket } from '../lib/api';
import { formatDate, formatTime, formatCurrency } from '../lib/utils';
import { Printer, AlertCircle } from 'lucide-react';

interface PublicTicket {
  id: string;
  ticket_code: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  status: string;
  total_amount: string | number;
  qr_code_data: string;
  created_at: string;
  session?: {
    id: string;
    session_date: string;
    start_time: string;
    event?: { id: string; title: string; category?: string };
    hall?: { id: string; name: string };
  };
  seat?: { seat_label?: string };
}

const RULES = [
  'Bu bilet etkinlik girişlerini kontrol etmek amacıyla dijital olarak üretilmiştir.',
  'Etkinliğin taahhüt edildiği gibi gerçekleşmesinden organizatör sorumludur.',
  'Satılan biletler nakde çevrilemez, iade alınamaz, devredilemez ve iptal edilemez.',
  'Etkinlik süresi boyunca biletinizi muhafaza ediniz.',
  'Bilet kaybı, kopyalanması vb. durumlarda herhangi bir sorumluluk kabul edilmez.',
  'Bu biletin mali bir değeri yoktur; mali değeri bulunan belgeleri organizatörden alabilirsiniz.',
  'Organizatör etkinlik programında değişiklik yapma hakkını saklı tutar.',
];

export default function DigitalTicket() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const [ticket,  setTicket]  = useState<PublicTicket | null>(null);
  const [qrUrl,   setQrUrl]   = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticketCode) return;
    fetchPublicTicket(ticketCode)
      .then(async (data: PublicTicket) => {
        setTicket(data);
        try {
          const url = await QRCode.toDataURL(data.qr_code_data, {
            width: 300, margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          setQrUrl(url);
        } catch { /* QR oluşturulamazsa boş kalır */ }
      })
      .catch(() => setError('Bilet bulunamadı. Bilet kodunu kontrol edin.'))
      .finally(() => setLoading(false));
  }, [ticketCode]);

  const handlePrint = () => {
    if (!ticket) return;

    const sDate = ticket.session?.session_date ? new Date(ticket.session.session_date) : null;
    const day   = sDate?.getDate() ?? '';
    const month = sDate ? sDate.toLocaleDateString('tr-TR', { month: 'long' }) : '';
    const year  = sDate?.getFullYear() ?? '';
    const dayName = sDate ? sDate.toLocaleDateString('tr-TR', { weekday: 'long' }) : '';
    const time  = ticket.session?.start_time?.slice(0, 5) ?? '';
    const price = formatCurrency(Number(ticket.total_amount));

    const win = window.open('', '', 'width=800,height=700');
    if (!win) return;

    const qrImg = qrUrl
      ? `<img src="${qrUrl}" alt="QR" width="130" height="130" />`
      : `<div style="width:130px;height:130px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:11px;color:#aaa;text-align:center;">QR</div>`;

    const rulesHtml = RULES.map(r => `<li>${r}</li>`).join('');

    win.document.write(`<!DOCTYPE html>
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
</body></html>`);
    win.document.close();
  };

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-10 text-center max-w-sm shadow">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Bilet Bulunamadı</h2>
          <p className="text-gray-500 text-sm">{error ?? 'Geçersiz bilet kodu.'}</p>
        </div>
      </div>
    );
  }

  const sessionDate = ticket.session?.session_date ? new Date(ticket.session.session_date) : null;
  const isCancelled = ticket.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">

        {/* Logo alanı */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="ebilet24.com" className="h-12 object-contain" />
        </div>

        {/* İptal uyarısı */}
        {isCancelled && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 text-sm text-center font-semibold">
            ⚠️ Bu bilet iptal edilmiştir
          </div>
        )}

        {/* Bilet kartı */}
        <div ref={printRef}
          className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 ${isCancelled ? 'border-red-300 opacity-70' : 'border-gray-200'}`}>

          {/* Üst şerit — etkinlik */}
          <div className="bg-blue-700 px-6 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">
              {ticket.session?.event?.category ?? 'Etkinlik'}
            </p>
            <h1 className="text-xl font-bold leading-tight">
              {ticket.session?.event?.title ?? '—'}
            </h1>
          </div>

          {/* İçerik */}
          <div className="flex">
            {/* Sol — QR */}
            <div className="bg-gray-50 border-r-2 border-dashed border-gray-300 flex flex-col items-center justify-center px-5 py-6 gap-3 min-w-[160px]">
              {qrUrl
                ? <img src={qrUrl} alt="QR Kod" className="w-32 h-32" />
                : <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">QR</div>
              }
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">PNR</p>
                <p className="font-mono font-bold text-gray-700 text-xs mt-0.5">{ticket.ticket_code}</p>
              </div>
            </div>

            {/* Sağ — bilgiler */}
            <div className="flex-1 p-5 flex flex-col gap-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Ad Soyad</p>
                <p className="font-bold text-gray-900 text-base">{ticket.customer_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Tarih</p>
                  <p className="font-bold text-2xl text-gray-900 leading-none">{sessionDate?.getDate()}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {sessionDate?.toLocaleDateString('tr-TR', { month: 'long' })}{' '}
                    {sessionDate?.getFullYear()}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {sessionDate?.toLocaleDateString('tr-TR', { weekday: 'long' })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Saat</p>
                  <span className="inline-block bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {formatTime(ticket.session?.start_time ?? '')}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Salon</p>
                <p className="text-gray-700 text-sm font-medium">📍 {ticket.session?.hall?.name ?? '—'}</p>
              </div>

              {ticket.seat?.seat_label && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Koltuk</p>
                  <p className="text-gray-700 text-sm font-medium">🎫 {ticket.seat.seat_label}</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Bilet Fiyatı</p>
                <p className="font-bold text-xl text-gray-900">{formatCurrency(Number(ticket.total_amount))}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kurallar */}
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="inline-block bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-md mb-3">
            Kurallar
          </div>
          <ul className="space-y-1.5">
            {RULES.map((r, i) => (
              <li key={i} className="text-xs text-gray-500 leading-relaxed flex gap-1.5">
                <span className="text-gray-300 flex-shrink-0">—</span>{r}
              </li>
            ))}
          </ul>
        </div>

        {/* Yazdır butonu */}
        <div className="mt-4 flex justify-center">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md">
            <Printer size={18} /> Yazdır / PDF'e Kaydet
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ebilet24.com — Dijital Bilet Sistemi
        </p>
      </div>
    </div>
  );
}
