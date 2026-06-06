import PDFDocument from 'pdfkit';
import { buildTicketVerificationUrl, createQrImage } from './qr.js';

function money(value = 0, currency = 'TRY') {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function safeDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('tr-TR');
  } catch {
    return String(value);
  }
}

function textOr(value, fallback = '-') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function fitText(value = '', max = 34) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

async function getQrDataUrl(ticket) {
  if (ticket?.qrImage && String(ticket.qrImage).startsWith('data:image')) {
    return ticket.qrImage;
  }

  return createQrImage(ticket.qrToken);
}

function drawLabelValue(doc, label, value, x, y, width = 92) {
  doc.fillColor('#8a6a24')
    .fontSize(6.4)
    .text(label.toUpperCase(), x, y, {
      width,
      characterSpacing: 0.45
    });

  doc.fillColor('#111111')
    .fontSize(9.2)
    .text(textOr(value), x, y + 8, {
      width,
      lineGap: 1
    });
}

export async function streamTicketPdf(res, ticket, options = {}) {
  const currency = options.currency || 'TRY';
  const verificationUrl = buildTicketVerificationUrl(ticket.qrToken);

  const eventTitle = ticket.event?.title || ticket.eventTitle || 'Tiatru Event';
  const hallName = ticket.hall?.name || ticket.hallName || 'Tiatru Hall';
  const bookingNumber = ticket.booking?.bookingNumber || '';
  const showtimeDate = ticket.showtime?.date;
  const showtimeTime = ticket.showtime?.startTime;
  const customerName = ticket.user?.fullName || ticket.booking?.customerSnapshot?.fullName || 'Guest';

  const qrDataUrl = await getQrDataUrl(ticket);
  const qrBase64 = String(qrDataUrl).replace(/^data:image\/png;base64,/, '');

  // 80mm x 150mm in PDF points.
  // This prevents A4/Letter multi-page tickets.
  const doc = new PDFDocument({
    size: [226.77, 425.2],
    margin: 12,
    autoFirstPage: true,
    info: {
      Title: `Tiatru Ticket ${ticket.ticketNumber}`
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${ticket.ticketNumber}.pdf"`);

  doc.pipe(res);

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const pad = 12;

  const cardX = pad;
  const cardY = pad;
  const cardW = pageW - pad * 2;
  const cardH = pageH - pad * 2;

  doc.rect(0, 0, pageW, pageH).fill('#ffffff');

  doc.roundedRect(cardX, cardY, cardW, cardH, 14)
    .strokeColor('#B8860B')
    .lineWidth(1.4)
    .stroke();

  doc.fillColor('#12070A')
    .fontSize(10)
    .text('TIATRU', cardX, 24, {
      align: 'center',
      width: cardW,
      characterSpacing: 1.8
    });

  doc.fillColor('#8a6a24')
    .fontSize(5.8)
    .text('MODERN TIYATRO BILET SISTEMI', cardX, 38, {
      align: 'center',
      width: cardW,
      characterSpacing: 0.8
    });

  doc.moveTo(cardX + 12, 52)
    .lineTo(cardX + cardW - 12, 52)
    .dash(3, { space: 3 })
    .strokeColor('#d8c28a')
    .lineWidth(0.8)
    .stroke()
    .undash();

  doc.fillColor('#12070A')
    .fontSize(14)
    .text(fitText(eventTitle, 42), cardX + 12, 62, {
      width: cardW - 24,
      align: 'center',
      lineGap: 2
    });

  doc.fillColor('#555555')
    .fontSize(7.5)
    .text(
      `${safeDate(showtimeDate)}  |  ${textOr(showtimeTime)}  |  ${fitText(hallName, 24)}`,
      cardX + 12,
      98,
      {
        width: cardW - 24,
        align: 'center'
      }
    );

  const qrSize = 118;
  const qrX = (pageW - qrSize) / 2;
  const qrY = 116;

  doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 10)
    .fillAndStroke('#ffffff', '#B8860B');

  doc.image(Buffer.from(qrBase64, 'base64'), qrX, qrY, {
    width: qrSize,
    height: qrSize
  });

  doc.fillColor('#111111')
    .fontSize(7)
    .text('Scan at entrance', cardX + 12, qrY + qrSize + 12, {
      width: cardW - 24,
      align: 'center'
    });

  doc.fillColor('#666666')
    .fontSize(5.4)
    .text(fitText(verificationUrl, 54), cardX + 12, qrY + qrSize + 23, {
      width: cardW - 24,
      align: 'center'
    });

  const detailsY = 288;

  drawLabelValue(doc, 'Ticket', ticket.ticketNumber, cardX + 14, detailsY, 88);
  drawLabelValue(doc, 'Seat', `${textOr(ticket.seatCode)} / ${textOr(ticket.category)}`, cardX + 112, detailsY, 78);
  drawLabelValue(doc, 'Booking', bookingNumber || '-', cardX + 14, detailsY + 35, 88);
  drawLabelValue(doc, 'Customer', fitText(customerName, 22), cardX + 112, detailsY + 35, 78);
  drawLabelValue(doc, 'Status', textOr(ticket.status), cardX + 14, detailsY + 70, 88);
  drawLabelValue(doc, 'Price', money(ticket.price, currency), cardX + 112, detailsY + 70, 78);

  doc.moveTo(cardX + 12, pageH - 36)
    .lineTo(cardX + cardW - 12, pageH - 36)
    .dash(3, { space: 3 })
    .strokeColor('#d8c28a')
    .lineWidth(0.8)
    .stroke()
    .undash();

  doc.fillColor('#555555')
    .fontSize(6.3)
    .text('Valid for one entry only. Do not share this QR code.', cardX + 12, pageH - 27, {
      width: cardW - 24,
      align: 'center'
    });

  doc.end();
}