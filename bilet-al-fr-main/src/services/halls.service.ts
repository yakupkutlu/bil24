import { api, unwrap, unwrapList } from './api';
import type { Hall, Seat } from '@/types';
import { normalizeHall, pickPayload } from '@/utils/apiAdapters';

export const hallsService = {
  list: (params?: Record<string, unknown>) => api.get('/halls', { params }).then((r) => unwrapList<Hall>(r, ['items', 'halls']).map(normalizeHall)),
  get: (id: string) => api.get(`/halls/${id}`).then(unwrap<any>).then((raw) => normalizeHall(pickPayload(raw, ['hall']))),
  create: (payload: Partial<Hall>) => api.post('/halls', payload).then(unwrap<any>).then((raw) => normalizeHall(pickPayload(raw, ['hall']))),
  update: (id: string, payload: Partial<Hall>) => api.put(`/halls/${id}`, payload).then(unwrap<any>).then((raw) => normalizeHall(pickPayload(raw, ['hall']))),
  remove: (id: string) => api.delete(`/halls/${id}`).then(unwrap),
  generateSeats: (id: string, payload?: { rows?: number; seatsPerRow?: number }) => api.post(`/halls/${id}/generate-seats`, payload ?? {}).then(unwrap<any>).then((raw) => normalizeHall(pickPayload(raw, ['hall']))),
  updateSeats: (id: string, seats: Seat[]) => api.put(`/halls/${id}/seats`, { seats }).then(unwrap<any>).then((raw) => normalizeHall(pickPayload(raw, ['hall'])))
};
