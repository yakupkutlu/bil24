import { api, unwrap, unwrapList } from './api';
import type { Payment } from '@/types';
import { normalizePayment, pickPayload } from '@/utils/apiAdapters';

export type CheckoutPayload = {
  bookingId: string;
  provider: string;
  method: string;
  paymentToken?: string;
  returnUrl?: string;
  callbackUrl?: string;
  amount?: number;
  currency?: string;
  source?: 'ONLINE' | 'BOX_OFFICE';
};

export type CheckoutResult = Payment & {
  redirectUrl?: string;
  paymentUrl?: string;
  checkoutUrl?: string;
  tickets?: unknown[];
  bookingId?: string;
};

function normalizeCheckout(raw: any): CheckoutResult {
  const source = raw?.payment ?? raw?.item ?? raw;
  return {
    ...normalizePayment(source),
    redirectUrl: raw?.redirectUrl ?? raw?.paymentUrl ?? raw?.checkoutUrl ?? source?.redirectUrl,
    paymentUrl: raw?.paymentUrl,
    checkoutUrl: raw?.checkoutUrl,
    tickets: raw?.tickets ?? source?.tickets,
    bookingId: raw?.bookingId ?? source?.bookingId
  };
}

export const paymentsService = {
  checkout: (payload: CheckoutPayload) => api.post('/payments/checkout', payload).then(unwrap<any>).then(normalizeCheckout),
  iyzicoCallback: (payload: unknown) => api.post('/payments/iyzico/callback', payload).then(unwrap),
  get: (id: string) => api.get(`/payments/${id}`).then(unwrap<any>).then((raw) => normalizePayment(pickPayload(raw, ['payment']))),
  list: (params?: Record<string, unknown>) => api.get('/payments', { params }).then((r) => unwrapList<Payment>(r, ['items', 'payments']).map(normalizePayment))
};
