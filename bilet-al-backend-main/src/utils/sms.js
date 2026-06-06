import { logger } from '../config/logger.js';

export async function sendSms({ to, message }) {
  // Placeholder: integrate Twilio/Netgsm/etc. in production.
  logger.info('SMS queued', { to, preview: message?.slice(0, 120) });
  return { queued: true };
}
