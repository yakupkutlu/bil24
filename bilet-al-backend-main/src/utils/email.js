import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

let transporterPromise;

async function getTransporter() {
  if (!env.SMTP_HOST) return null;
  if (!transporterPromise) {
    transporterPromise = import('nodemailer').then(({ default: nodemailer }) => nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: Number(env.SMTP_PORT) === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
    }));
  }
  return transporterPromise;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    logger.warn('Email skipped: missing recipient', { subject });
    return { queued: false, skipped: true, reason: 'missing_recipient' };
  }

  const transporter = await getTransporter();
  if (!transporter) {
    logger.info('Email queued in log-only mode', { to, subject, preview: text || html?.replace(/<[^>]+>/g, ' ').slice(0, 140) });
    return { queued: true, provider: 'LOG_ONLY' };
  }

  const info = await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html, text });
  logger.info('Email sent', { to, subject, messageId: info.messageId });
  return { queued: true, provider: 'SMTP', messageId: info.messageId };
}

export function buildTicketEmail({ ticket, verifyUrl }) {
  const eventTitle = ticket.event?.title || 'Tiatru Event';
  const showtime = ticket.showtime;
  const date = showtime?.date ? new Date(showtime.date).toLocaleDateString('tr-TR') : '';
  const time = showtime?.startTime || '';
  const text = `Your Tiatru ticket ${ticket.ticketNumber}\nEvent: ${eventTitle}\nDate: ${date} ${time}\nSeat: ${ticket.seatCode}\nVerify: ${verifyUrl}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#0B0B0D;color:#fff;padding:28px;border-radius:18px">
      <p style="color:#B8860B;letter-spacing:3px;font-size:12px">TIATRU E-TICKET</p>
      <h1 style="color:#F5E8C7;margin:0 0 16px">${eventTitle}</h1>
      <p><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Date:</strong> ${date} ${time}</p>
      <p><strong>Seat:</strong> ${ticket.seatCode} · ${ticket.category}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p><a href="${verifyUrl}" style="color:#B8860B">Open verification ticket</a></p>
      <p style="font-size:12px;color:#bbb">Do not share this QR/verification link publicly.</p>
    </div>`;
  return { text, html };
}
