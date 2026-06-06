import { create } from 'zustand';
import type { Event, Seat, Showtime, Ticket } from '@/types';

export interface BookingCustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  discountCode?: string;
  note?: string;
}

export interface PriceSummary {
  subtotal: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
}

const calculatePrice = (seats: Seat[], discountCode?: string): PriceSummary => {
  const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceFee = seats.length ? Math.round(subtotal * 0.06) : 0;
  const tax = seats.length ? Math.round(subtotal * 0.10) : 0;
  const discount = discountCode?.trim().toUpperCase() === 'TIATRU10' ? Math.round(subtotal * 0.10) : 0;
  return { subtotal, serviceFee, tax, discount, total: Math.max(0, subtotal + serviceFee + tax - discount) };
};

interface BookingState {
  selectedEvent?: Event;
  selectedShowtime?: Showtime;
  selectedSeats: Seat[];
  seatHoldExpiresAt?: string;
  customerInfo: BookingCustomerInfo;
  paymentMethod: 'CARD' | 'MOCK' | 'BOX_OFFICE';
  priceSummary: PriceSummary;
  bookingId?: string;
  bookingNumber?: string;
  paymentId?: string;
  generatedTickets: Ticket[];
  beginHold: (payload: { event?: Event; showtime: Showtime; seats: Seat[]; holdMinutes?: number }) => void;
  setSelectedSeats: (seats: Seat[]) => void;
  setCustomerInfo: (info: Partial<BookingCustomerInfo>) => void;
  setPaymentMethod: (method: BookingState['paymentMethod']) => void;
  completeBooking: (payload?: string | { bookingId?: string; bookingNumber?: string; paymentId?: string; tickets?: Ticket[] }) => void;
  clearBooking: () => void;
}

const defaultCustomerInfo: BookingCustomerInfo = {
  fullName: '',
  email: '',
  phone: '',
  discountCode: ''
};

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedSeats: [],
  customerInfo: defaultCustomerInfo,
  paymentMethod: 'MOCK',
  priceSummary: calculatePrice([]),
  generatedTickets: [],
  beginHold: ({ event, showtime, seats, holdMinutes = 10 }) => {
    const expiresAt = new Date(Date.now() + holdMinutes * 60_000).toISOString();
    const discountCode = get().customerInfo.discountCode;
    set({
      selectedEvent: event,
      selectedShowtime: showtime,
      selectedSeats: seats,
      seatHoldExpiresAt: expiresAt,
      priceSummary: calculatePrice(seats, discountCode),
      generatedTickets: []
    });
  },
  setSelectedSeats: (seats) => set((state) => ({ selectedSeats: seats, priceSummary: calculatePrice(seats, state.customerInfo.discountCode) })),
  setCustomerInfo: (info) => set((state) => {
    const customerInfo = { ...state.customerInfo, ...info };
    return { customerInfo, priceSummary: calculatePrice(state.selectedSeats, customerInfo.discountCode) };
  }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  completeBooking: (payload) => {
    if (typeof payload === 'string' || payload === undefined) {
      set({ bookingNumber: payload ?? `TTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` });
      return;
    }
    set({
      bookingId: payload.bookingId,
      bookingNumber: payload.bookingNumber ?? `TTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentId: payload.paymentId,
      generatedTickets: payload.tickets ?? []
    });
  },
  clearBooking: () => set({
    selectedEvent: undefined,
    selectedShowtime: undefined,
    selectedSeats: [],
    seatHoldExpiresAt: undefined,
    customerInfo: defaultCustomerInfo,
    paymentMethod: 'MOCK',
    priceSummary: calculatePrice([]),
    bookingId: undefined,
    bookingNumber: undefined,
    paymentId: undefined,
    generatedTickets: []
  })
}));
