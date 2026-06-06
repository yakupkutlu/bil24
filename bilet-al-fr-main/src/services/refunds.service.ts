import { api, unwrap, unwrapList } from './api';
import type { Refund } from '@/types';
import { normalizeRefund, pickPayload } from '@/utils/apiAdapters';
export const refundsService = {
  create: (payload: { bookingId: string; reason: string; amount?: number }) => api.post('/refunds', payload).then(unwrap<any>).then((raw) => normalizeRefund(pickPayload(raw, ['refund']))),
  list: (params?: Record<string, unknown>) => api.get('/refunds', { params }).then((r) => unwrapList<Refund>(r, ['items', 'refunds']).map(normalizeRefund)),
  get: (id: string) => api.get(`/refunds/${id}`).then(unwrap<any>).then((raw) => normalizeRefund(pickPayload(raw, ['refund']))),
  approve: (id: string) => api.patch(`/refunds/${id}/approve`).then(unwrap<any>).then((raw) => normalizeRefund(pickPayload(raw, ['refund']))),
  reject: (id: string, reason?: string) => api.patch(`/refunds/${id}/reject`, { reason }).then(unwrap<any>).then((raw) => normalizeRefund(pickPayload(raw, ['refund']))),
  process: (id: string) => api.patch(`/refunds/${id}/process`).then(unwrap<any>).then((raw) => normalizeRefund(pickPayload(raw, ['refund'])))
};
