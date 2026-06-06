import { api, unwrap, unwrapList } from './api';
import type { Booking } from '@/types';
import { normalizeBooking, pickPayload } from '@/utils/apiAdapters';

export type CreateBookingPayload = {
  showtimeId: string;
  seatCodes: string[];
  source?: 'ONLINE' | 'BOX_OFFICE';
  customerInfo?: unknown;
  subtotal?: number;
  serviceFee?: number;
  discount?: number;
  tax?: number;
  total?: number;
};

export const bookingsService = {
  create: (payload: CreateBookingPayload) => api.post('/bookings', payload).then(unwrap<any>).then((raw) => normalizeBooking(pickPayload(raw, ['booking']))),
  my: (params?: Record<string, unknown>) => api.get('/bookings/my', { params }).then((r) => unwrapList<Booking>(r, ['items', 'bookings']).map(normalizeBooking)),
  list: (params?: Record<string, unknown>) => api.get('/bookings', { params }).then((r) => unwrapList<Booking>(r, ['items', 'bookings']).map(normalizeBooking)),
  get: (id: string) => api.get(`/bookings/${id}`).then(unwrap<any>).then((raw) => normalizeBooking(pickPayload(raw, ['booking']))),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`).then(unwrap<any>).then((raw) => normalizeBooking(pickPayload(raw, ['booking']))),
  expire: (id: string) => api.patch(`/bookings/${id}/expire`).then(unwrap<any>).then((raw) => normalizeBooking(pickPayload(raw, ['booking'])))
};
