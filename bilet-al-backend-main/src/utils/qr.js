import QRCode from 'qrcode';
import { env } from '../config/env.js';

function isAbsoluteUrl(value = '') {
  return /^https?:\/\//i.test(String(value));
}

export function buildTicketVerificationUrl(qrTokenOrUrl) {
  const value = String(qrTokenOrUrl || '').trim();

  if (isAbsoluteUrl(value)) return value;

  const token = value.includes('/verify-ticket/')
    ? value.split('/verify-ticket/').pop()
    : value;

  return `${env.CLIENT_URL.replace(/\/$/, '')}/verify-ticket/${encodeURIComponent(token)}`;
}

export async function createQrImage(qrTokenOrUrl) {
  return QRCode.toDataURL(buildTicketVerificationUrl(qrTokenOrUrl), {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 520
  });
}