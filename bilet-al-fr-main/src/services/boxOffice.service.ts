import { api, unwrap } from './api';
import type { Booking, Payment, Ticket } from '@/types';
import { listPayload, normalizeBooking, normalizePayment, normalizeTicket, pickPayload } from '@/utils/apiAdapters';

export type BoxOfficePaymentType = 'CASH' | 'CARD' | 'COMPLIMENTARY';

export type BoxOfficeManualSalePayload = {
  showtimeId: string;
  seatCodes: string[];
  seats?: Array<{ seatCode: string; category: string; price: number }>;
  customerInfo: { fullName: string; phone?: string; email?: string };
  paymentType: BoxOfficePaymentType;
  subtotal?: number;
  serviceFee?: number;
  total?: number;
};

export type BoxOfficeManualSaleResult = {
  booking: Booking;
  payment?: Payment;
  tickets: Ticket[];
};

function pickId(value: unknown) {
  const item = value as any;
  return String(item?.id ?? item?._id ?? item?.bookingId ?? item?.booking?._id ?? item?.booking?.id ?? '');
}

function mapPayment(paymentType: BoxOfficePaymentType) {
  if (paymentType === 'CASH') return { provider: 'CASH', method: 'CASH' };
  if (paymentType === 'CARD') return { provider: 'MOCK', method: 'CARD' };
  return { provider: 'MOCK', method: 'CASH', complimentary: true };
}

export const boxOfficeService = {
  sellTicket: (payload: {
    showtimeId: string;
    seatCodes: string[];
    customerInfo: { fullName: string; phone?: string; email?: string };
    paymentType: BoxOfficePaymentType;
  }) => api.post('/bookings', { ...payload, source: 'BOX_OFFICE' }).then(unwrap<any>).then((raw) => normalizeBooking(pickPayload(raw, ['booking']))),

  completeManualSale: async (payload: BoxOfficeManualSalePayload): Promise<BoxOfficeManualSaleResult> => {
    const bookingPayload = {
      showtimeId: payload.showtimeId,
      seatCodes: payload.seatCodes,
      seats: payload.seats,
      customerInfo: payload.customerInfo,
      source: 'BOX_OFFICE',
      subtotal: payload.subtotal,
      serviceFee: payload.serviceFee,
      total: payload.total
    };

    const rawBooking = await api.post('/bookings', bookingPayload).then(unwrap<any>);
    const booking = normalizeBooking(pickPayload(rawBooking, ['booking']));
    const bookingId = pickId(booking);

    if (!bookingId) {
      throw new Error('Rezervasyon oluşturuldu ancak backend rezervasyon ID döndürmedi.');
    }

    const paymentConfig = mapPayment(payload.paymentType);
    const paymentPayload = {
      bookingId,
      provider: paymentConfig.provider,
      method: paymentConfig.method,
      source: 'BOX_OFFICE',
      paymentType: payload.paymentType,
      amount: payload.total,
      complimentary: paymentConfig.complimentary ?? false,
      customerInfo: payload.customerInfo
    };

    const rawPayment = await api.post('/payments/checkout', paymentPayload).then(unwrap<any>);
    const paymentSource = rawPayment?.payment ?? rawPayment;
    const payment = paymentSource ? normalizePayment(paymentSource) : undefined;

    const embeddedTickets = listPayload<any>(rawPayment, ['tickets']).map(normalizeTicket);
    let tickets = embeddedTickets;

    if (!tickets.length) {
      try {
        const rawTickets = await api.get('/tickets', { params: { bookingId } }).then(unwrap<any>);
        tickets = listPayload<any>(rawTickets, ['tickets', 'items']).map(normalizeTicket);
      } catch {
        tickets = [];
      }
    }

    return { booking, payment, tickets };
  },

  verifyTicket: (qrToken: string) => api.post('/tickets/verify', { qrToken }).then(unwrap<any>).then((raw) => normalizeTicket(pickPayload(raw, ['ticket']))),
  markTicketUsed: (ticketId: string) => api.post(`/tickets/${ticketId}/mark-used`).then(unwrap<any>).then((raw) => normalizeTicket(pickPayload(raw, ['ticket']))),
  confirmReservationPayment: (bookingId: string, paymentType: 'CASH' | 'CARD') => api.post('/payments/checkout', { bookingId, provider: paymentType === 'CASH' ? 'CASH' : 'MOCK', method: paymentType }).then(unwrap),
  cancelReservation: (bookingId: string) => api.patch(`/bookings/${bookingId}/cancel`).then(unwrap<any>).then((raw) => normalizeBooking(pickPayload(raw, ['booking'])))
};
