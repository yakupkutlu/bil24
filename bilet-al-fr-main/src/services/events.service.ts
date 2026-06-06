import { api, unwrap, unwrapList } from './api';
import type { Event } from '@/types';
import { normalizeEvent, pickPayload } from '@/utils/apiAdapters';

export const eventsService = {
  list: (params?: Record<string, unknown>) => api.get('/events', { params }).then((r) => unwrapList<Event>(r, ['items', 'events']).map(normalizeEvent)),
  getBySlug: (slug: string) => api.get(`/events/${slug}`).then(unwrap<any>).then((raw) => normalizeEvent(pickPayload(raw, ['event']))),
  create: (payload: Partial<Event>) => api.post('/events', payload).then(unwrap<any>).then((raw) => normalizeEvent(pickPayload(raw, ['event']))),
  update: (id: string, payload: Partial<Event>) => api.put(`/events/${id}`, payload).then(unwrap<any>).then((raw) => normalizeEvent(pickPayload(raw, ['event']))),
  remove: (id: string) => api.delete(`/events/${id}`).then(unwrap),
  updateStatus: (id: string, status: Event['status']) => api.patch(`/events/${id}/status`, { status }).then(unwrap<any>).then((raw) => normalizeEvent(pickPayload(raw, ['event'])))
};
