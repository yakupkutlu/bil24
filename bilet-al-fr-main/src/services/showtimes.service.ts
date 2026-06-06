import { api, unwrap, unwrapList } from './api';
import type { Showtime } from '@/types';
import { normalizeShowtime, pickPayload } from '@/utils/apiAdapters';

export const showtimesService = {
  list: (params?: Record<string, unknown>) => api.get('/showtimes', { params }).then((r) => unwrapList<Showtime>(r, ['items', 'showtimes']).map(normalizeShowtime)),
  get: (id: string) => api.get(`/showtimes/${id}`).then(unwrap<any>).then((raw) => normalizeShowtime(pickPayload(raw, ['showtime']))),
  listByEvent: (eventId: string) => api.get(`/events/${eventId}/showtimes`).then((r) => unwrapList<Showtime>(r, ['items', 'showtimes']).map(normalizeShowtime)),
  create: (payload: Partial<Showtime>) => api.post('/showtimes', payload).then(unwrap<any>).then((raw) => normalizeShowtime(pickPayload(raw, ['showtime']))),
  update: (id: string, payload: Partial<Showtime>) => api.put(`/showtimes/${id}`, payload).then(unwrap<any>).then((raw) => normalizeShowtime(pickPayload(raw, ['showtime']))),
  remove: (id: string) => api.delete(`/showtimes/${id}`).then(unwrap),
  updateStatus: (id: string, status: Showtime['status']) => api.patch(`/showtimes/${id}/status`, { status }).then(unwrap<any>).then((raw) => normalizeShowtime(pickPayload(raw, ['showtime'])))
};
