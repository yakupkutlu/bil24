import { api, unwrap, unwrapList, API_BASE_URL } from './api';
import type { Ticket } from '@/types';
import { normalizeTicket, pickPayload } from '@/utils/apiAdapters';
import { downloadBlob } from '@/utils/ticketPrint';

export const ticketsService = {
  my: (params?: Record<string, unknown>) => api.get('/tickets/my', { params }).then((r) => unwrapList<Ticket>(r, ['items', 'tickets']).map(normalizeTicket)),
  list: (params?: Record<string, unknown>) => api.get('/tickets', { params }).then((r) => unwrapList<Ticket>(r, ['items', 'tickets']).map(normalizeTicket)),
  listByBooking: (bookingId: string) => api.get('/tickets', { params: { bookingId } }).then((r) => unwrapList<Ticket>(r, ['items', 'tickets']).map(normalizeTicket)),
  get: (id: string) => api.get(`/tickets/${id}`).then(unwrap<any>).then((raw) => normalizeTicket(pickPayload(raw, ['ticket']))),
  downloadUrl: (id: string) => `${API_BASE_URL}/tickets/${id}/download`,
  downloadBlob: (id: string) => api.get(`/tickets/${id}/download`, { responseType: 'blob' }).then((response) => response.data as Blob),
  downloadPdf: async (ticket: Ticket) => {
    const blob = await ticketsService.downloadBlob(ticket.id);
    downloadBlob(blob, `${ticket.ticketNumber || ticket.id}.pdf`);
  },
  verify: (qrToken: string) => api.post('/tickets/verify', { qrToken }).then(unwrap<any>).then((raw) => normalizeTicket(pickPayload(raw, ['ticket']))),
  markUsed: (id: string) => api.post(`/tickets/${id}/mark-used`).then(unwrap<any>).then((raw) => normalizeTicket(pickPayload(raw, ['ticket']))),
  resendEmail: (id: string) => api.post(`/tickets/${id}/resend-email`).then(unwrap)
};
