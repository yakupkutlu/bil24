import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { Download, Printer } from 'lucide-react';
import { Seat, Session, Ticket } from '../../types';
import { formatCurrency, formatTime } from '../../lib/utils';

interface TicketCardProps {
  ticket: Ticket;
  session?: Session & { event?: { title?: string }; hall?: { name?: string } };
  seat?: Seat;
}

export default function TicketCard({ ticket, session, seat }: TicketCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticket.qr_code_data) return;
    QRCode.toDataURL(ticket.qr_code_data, {
      width: 300, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [ticket.qr_code_data]);

  const sessionDate = session?.session_date ? new Date(session.session_date) : null;
  const dayName  = sessionDate ? sessionDate.toLocaleDateString('tr-TR', { weekday: 'long' }) : '';
  const monthName = sessionDate ? sessionDate.toLocaleDateString('tr-TR', { month: 'long' }) : '';

  const handlePrint = () => {
    const win = window.open('', '', 'width=800,height=700');
    if (!win) return;

    const printDay   = sessionDate?.getDate() ?? '';
    const printYear  = sessionDate?.getFullYear() ?? '';
    const printTime  = session?.start_time?.slice(0, 5) ?? '';
    const priceStr   = formatCurrency(Number(ticket.total_amount));
    const qrImg = qrDataUrl
      ? `<img src="${qrDataUrl}" alt="QR" width="130" height="130" />`
      : `<div style="width:130px;height:130px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:11px;color:#aaa;">QR</div>`;

    win.document.write(`<!DOCTYPE html>
<html lang="tr"><head>
<meta charset="UTF-8">
<title>Bilet — ${ticket.ticket_code}</title>
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
  .price-lbl{font-size:9px;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;text-align:right}
  .price-val{font-size:22px;font-weight:bold;color:#111;text-align:right}
  .rules{padding:18px 24px 22px}
  .rules-title{font-size:13px;font-weight:bold;background:#1d4ed8;color:#fff;display:inline-block;padding:5px 14px;border-radius:5px;margin-bottom:12px}
  .rules ul{list-style:none;padding:0}
  .rules li{font-size:11px;color:#555;line-height:1.65;padding:2px 0}
  .rules li::before{content:"— "}
  @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0}}
</style>
</head>
<body>
<div class="page">
  <div class="ticket">
    <div class="t-left">
      ${qrImg}
      <div class="pnr-lbl">PNR</div>
      <div class="pnr-val">${ticket.ticket_code}</div>
    </div>
    <div class="t-right">
      <div>
        <div class="ev-title">${session?.event?.title ?? '—'}</div>
        <div class="cust-name">${ticket.customer_name}</div>
        <div class="grid">
          <div>
            <div class="lbl">Tarih</div>
            <div class="day-num">${printDay}</div>
            <div class="month">${monthName} ${printYear} · ${dayName}</div>
          </div>
          <div>
            <div class="lbl">Saat</div>
            <span class="badge">${printTime}</span>
          </div>
          <div>
            <div class="lbl">Salon</div>
            <div class="val">📍 ${session?.hall?.name ?? '—'}</div>
          </div>
          ${seat ? `<div><div class="lbl">Koltuk</div><div class="val">🎫 ${seat.seat_label}</div></div>` : ''}
        </div>
      </div>
      <div class="price-row">
        <div>
          <div class="price-lbl">Bilet Fiyatı</div>
          <div class="price-val">${priceStr}</div>
        </div>
      </div>
    </div>
  </div>
  <div class="rules">
    <div class="rules-title">Kurallar</div>
    <ul>
      <li>Bu bilet etkinlik girişlerini kontrol etmek amacıyla dijital olarak üretilmiştir.</li>
      <li>Etkinliğin taahhüt edildiği gibi gerçekleşmesinden biletimGO sorumlu değildir.</li>
      <li>Satılan biletler nakde çevrilemez, iade alınamaz, devredilemez ve iptal edilemez.</li>
      <li>Etkinlik süresi boyunca biletinizi muhafaza ediniz. Organizatör dilediği zaman biletleri kontrol edebilir.</li>
      <li>Bilet kaybı, kopyalanması vb. durumlarda organizatör ve biletimGO herhangi bir sorumluluk kabul etmez.</li>
      <li>biletimGO'dan aldığınız bu biletin mali bir değeri yoktur. Mali değeri bulunan biletleri ve/veya faturaları organizatörden teslim alabilirsiniz.</li>
      <li>Dare Team etkinlik programında değişiklik yapma hakkını saklı tutar. Erteleme, tarih ve saat değişikliği gibi durumlara karşı etkinlik ve organizatörün iletişim kanallarını takip ediniz.</li>
    </ul>
  </div>
</div>
<script>window.onload = function(){ window.print(); }<\/script>
</body></html>`);
    win.document.close();
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `bilet-${ticket.ticket_code}.png`;
      link.click();
    } catch {
      if (qrDataUrl) {
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `qr-${ticket.ticket_code}.png`;
        link.click();
      }
    }
  };

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {/* Bilet kartı */}
      <div
        ref={cardRef}
        className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white"
        style={{ fontFamily: 'sans-serif' }}
      >
        <div className="flex">
          {/* Sol — QR + PNR */}
          <div className="bg-gray-50 border-r-2 border-dashed border-gray-300 flex flex-col items-center justify-center px-6 py-5 gap-3 min-w-[160px]">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR" className="w-32 h-32" />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                QR yükleniyor
              </div>
            )}
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">PNR</p>
              <p className="font-mono text-xs font-bold text-gray-700">{ticket.ticket_code}</p>
            </div>
          </div>

          {/* Sağ — Etkinlik bilgileri */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {session?.event?.title || '—'}
                </h3>
                <p className="text-base font-semibold text-orange-500 mt-0.5">
                  {ticket.customer_name}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Tarih</p>
                  <p className="font-bold text-2xl text-gray-900 leading-none">
                    {sessionDate?.getDate()}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {monthName} {sessionDate?.getFullYear()} · {dayName}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Saat</p>
                  <span className="inline-block bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {formatTime(session?.start_time)}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Salon</p>
                  <p className="font-medium text-gray-800 text-xs">
                    📍 {session?.hall?.name || '—'}
                  </p>
                </div>

                {seat && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Koltuk</p>
                    <p className="font-medium text-gray-800 text-xs">🎫 {seat.seat_label}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Bilet Fiyatı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(Number(ticket.total_amount))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kurallar */}
        <div className="border-t-2 border-dashed border-gray-200 px-6 py-4 bg-gray-50">
          <p className="text-[11px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Kurallar</p>
          <ul className="space-y-1">
            {[
              'Bu bilet etkinlik girişlerini kontrol etmek amacıyla dijital olarak üretilmiştir.',
              'Etkinliğin taahhüt edildiği gibi gerçekleşmesinden biletimGO sorumlu değildir.',
              'Satılan biletler nakde çevrilemez, iade alınamaz, devredilemez ve iptal edilemez.',
              'Etkinlik süresi boyunca biletinizi muhafaza ediniz. Organizatör dilediği zaman biletleri kontrol edebilir.',
              'Bilet kaybı, kopyalanması vb. durumlarda organizatör ve biletimGO herhangi bir sorumluluk kabul etmez.',
              'biletimGO\'dan aldığınız bu biletin mali bir değeri yoktur. Mali değeri bulunan biletleri ve/veya faturaları organizatörden teslim alabilirsiniz.',
              'Dare Team etkinlik programında değişiklik yapma hakkını saklı tutar. Erteleme, tarih ve saat değişikliği gibi durumlara karşı etkinlik ve organizatörün iletişim kanallarını takip ediniz.',
            ].map((rule, i) => (
              <li key={i} className="text-[10px] text-gray-500 leading-relaxed before:content-['—_']">
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Aksiyon Butonları */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          <Printer size={16} /> Yazdır
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
        >
          <Download size={16} /> PNG İndir
        </button>
      </div>
    </div>
  );
}
