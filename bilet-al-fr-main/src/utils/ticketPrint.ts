import type { Ticket } from '@/types';
import { dateTime, money } from '@/utils/formatters';

function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function eventTitle(ticket: Ticket) {
  return typeof ticket.event === 'string' ? ticket.event : ticket.event.title;
}

function hallName(ticket: Ticket) {
  return typeof ticket.hall === 'string' ? ticket.hall : ticket.hall.name;
}

function showtimeDate(ticket: Ticket) {
  if (typeof ticket.showtime === 'string') return '';
  return ticket.showtime?.date;
}

export function ticketPrintHtml(tickets: Ticket[], title = 'Tiatru E-Ticket') {
  const cards = tickets.map((ticket) => `
    <article class="ticket">
      <section class="ticket-main">
        <p class="eyebrow">TIATRU E-BİLET</p>
        <h1>${esc(eventTitle(ticket))}</h1>
        <div class="grid">
          <p><span>Bilet</span>${esc(ticket.ticketNumber)}</p>
          <p><span>Durum</span>${esc(ticket.status)}</p>
          <p><span>Koltuk</span>${esc(ticket.seatCode)} · ${esc(ticket.category)}</p>
          <p><span>Salon</span>${esc(hallName(ticket))}</p>
          <p><span>Tarih</span>${esc(dateTime(showtimeDate(ticket)))}</p>
          <p><span>Fiyat</span>${esc(money(ticket.price))}</p>
        </div>
      </section>
      <aside class="qr">
        ${ticket.qrImage ? `<img src="${esc(ticket.qrImage)}" alt="QR" />` : `<div class="qrbox">${esc(ticket.qrToken).slice(0, 42)}</div>`}
        <small>${esc(ticket.qrToken)}</small>
      </aside>
    </article>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    *{box-sizing:border-box} body{margin:0;background:#f8f1df;color:#12070a;font-family:Inter,Arial,sans-serif;padding:28px}
    .brand{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;border-bottom:2px solid #b8860b;padding-bottom:14px}
    .brand h2{margin:0;font-family:Georgia,serif;font-size:32px}.brand p{margin:0;color:#7a0c0c;font-weight:700;letter-spacing:.18em;font-size:12px}
    .ticket{break-inside:avoid;display:grid;grid-template-columns:1fr 210px;gap:18px;margin:0 0 20px;padding:22px;border:2px dashed #b8860b;border-radius:24px;background:white;box-shadow:0 14px 40px rgba(18,7,10,.12)}
    .eyebrow{margin:0 0 8px;color:#b8860b;font-weight:800;letter-spacing:.22em;font-size:11px}.ticket h1{margin:0 0 18px;font-family:Georgia,serif;font-size:30px;color:#7a0c0c}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.grid p{margin:0;padding:12px;border-radius:14px;background:#f8f1df;font-weight:800}.grid span{display:block;color:#6b5b4b;font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:700;margin-bottom:4px}
    .qr{border-left:1px dashed #b8860b;padding-left:18px;text-align:center;display:grid;align-content:center;gap:10px}.qr img{width:150px;height:150px;object-fit:contain;margin:auto}.qrbox{width:150px;height:150px;margin:auto;display:grid;place-items:center;border:8px solid #12070a;color:#12070a;font-size:12px;overflow:hidden;padding:10px}.qr small{word-break:break-all;color:#6b5b4b}
    @media print{body{background:white;padding:0}.ticket{box-shadow:none;page-break-inside:avoid}.no-print{display:none}}
  </style>
</head>
<body>
  <div class="brand"><h2>Tiatru</h2><p>MODERN TİYATRO BİLET SİSTEMİ</p></div>
  ${cards}
</body>
</html>`;
}

export function printTickets(tickets: Ticket[], title?: string) {
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=980,height=720');
  if (!popup) throw new Error('Browser blocked the print window. Please allow popups for this site.');
  popup.document.open();
  popup.document.write(ticketPrintHtml(tickets, title));
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 250);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
