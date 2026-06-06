import type { Booking, DashboardReport, Event, Hall, Payment, Refund, Seat, Showtime, Ticket, User } from '@/types';

export const POSTER_PLACEHOLDER = '/placeholder-poster.svg';

export function pickPayload<T = any>(payload: unknown, keys: string[] = []): T {
  const value = payload as any;
  if (!value) return value as T;
  if (value.item) return value.item as T;
  for (const key of keys) if (value[key]) return value[key] as T;
  return value as T;
}

export function listPayload<T>(payload: unknown, preferredKeys: string[] = []): T[] {
  const value = payload as any;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  for (const key of preferredKeys) if (Array.isArray(value?.[key])) return value[key];
  const listKeys = ['data', 'docs', 'results', 'events', 'showtimes', 'halls', 'bookings', 'tickets', 'users', 'payments', 'refunds', 'auditLogs', 'logs', 'notifications'];
  for (const key of listKeys) if (Array.isArray(value?.[key])) return value[key];
  return [];
}

export function normalizeId<T extends Record<string, any>>(raw: T | null | undefined): T & { id: string } {
  const item = raw ?? {} as T;
  return { ...item, id: String((item as any).id ?? (item as any)._id ?? (item as any).slug ?? '') };
}

export function normalizeEvent(raw: any): Event {
  const item = normalizeId(raw);
  return {
    id: item.id,
    title: item.title ?? 'Başlıksız etkinlik',
    slug: item.slug ?? item.id,
    description: item.description ?? item.shortDescription ?? '',
    shortDescription: item.shortDescription ?? item.description ?? '',
    posterImage: item.posterImage ?? item.poster ?? item.image ?? POSTER_PLACEHOLDER,
    gallery: item.gallery ?? [],
    trailerUrl: item.trailerUrl,
    category: item.category ?? 'Tiyatro',
    language: item.language ?? 'Türkçe',
    durationMinutes: Number(item.durationMinutes ?? item.duration ?? 90),
    ageLimit: item.ageLimit ?? '7+',
    cast: item.cast ?? [],
    director: item.director ?? 'Tiatru Prodüksiyon',
    status: item.status ?? 'PUBLISHED',
    priceFrom: item.priceFrom ?? item.minPrice ?? item.price
  };
}

export function normalizeHall(raw: any): Hall {
  const item = normalizeId(raw);
  return {
    id: item.id,
    name: item.name ?? 'Salon',
    description: item.description,
    capacity: Number(item.capacity ?? item.seatMap?.length ?? 0),
    rows: Number(item.rows ?? 0),
    seatsPerRow: Number(item.seatsPerRow ?? 0),
    seatMap: (item.seatMap ?? item.seats ?? []).map?.(normalizeSeat) ?? [],
    status: item.status ?? 'ACTIVE'
  };
}

export function normalizeShowtime(raw: any): Showtime {
  const item = normalizeId(raw);
  return {
    id: item.id,
    event: typeof item.event === 'object' && item.event ? normalizeEvent(item.event) : item.event ?? item.eventId ?? '',
    hall: typeof item.hall === 'object' && item.hall ? normalizeHall(item.hall) : item.hall ?? item.hallId ?? '',
    date: item.date ?? item.startDate ?? item.startDateTime ?? item.startAt ?? new Date().toISOString(),
    startTime: item.startTimeText ?? item.startTime ?? item.startAt ?? '20:00',
    endTime: item.endTimeText ?? item.endTime ?? item.endAt ?? '22:00',
    status: item.status ?? 'ON_SALE',
    pricing: item.pricing ?? { VIP: 0, STANDARD: 0, STUDENT: 0 },
    availableFrom: item.availableFrom,
    availableUntil: item.availableUntil
  };
}

export function normalizeSeat(raw: any): Seat {
  return {
    code: raw.code ?? raw.seatCode ?? `${raw.row ?? ''}${raw.number ?? ''}`,
    row: raw.row,
    number: raw.number,
    category: raw.category ?? 'STANDARD',
    price: Number(raw.price ?? 0),
    status: raw.status ?? (raw.isBlocked ? 'DISABLED' : 'AVAILABLE'),
    isAccessible: raw.isAccessible,
    isBlocked: raw.isBlocked,
    position: raw.position
  };
}

export function normalizeUser(raw: any): User {
  const item = normalizeId(raw);
  return {
    id: item.id,
    fullName: item.fullName ?? item.name ?? item.email ?? 'Kullanıcı',
    email: item.email ?? '',
    phone: item.phone,
    role: item.role ?? 'CUSTOMER',
    avatar: item.avatar,
    status: item.status ?? 'ACTIVE',
    preferences: item.preferences,
    createdAt: item.createdAt
  };
}

export function normalizeBooking(raw: any): Booking {
  const item = normalizeId(raw);
  return {
    id: item.id,
    bookingNumber: item.bookingNumber ?? item.number ?? item.id,
    user: typeof item.user === 'object' && item.user ? normalizeUser(item.user) : item.user ?? '',
    showtime: typeof item.showtime === 'object' && item.showtime ? normalizeShowtime(item.showtime) : item.showtime ?? item.showtimeId ?? '',
    seats: item.seats ?? [],
    status: item.status ?? 'PENDING',
    subtotal: Number(item.subtotal ?? 0),
    serviceFee: Number(item.serviceFee ?? 0),
    discount: Number(item.discount ?? 0),
    tax: Number(item.tax ?? 0),
    total: Number(item.total ?? item.amount ?? 0),
    expiresAt: item.expiresAt,
    source: item.source ?? 'ONLINE',
    createdAt: item.createdAt ?? new Date().toISOString()
  };
}

export function normalizeTicket(raw: any): Ticket {
  const item = normalizeId(raw?.ticket ?? raw?.item ?? raw);
  return {
    id: item.id,
    ticketNumber: item.ticketNumber ?? item.number ?? item.id,
    booking: typeof item.booking === 'object' && item.booking ? normalizeBooking(item.booking) : item.booking ?? '',
    user: typeof item.user === 'object' && item.user ? normalizeUser(item.user) : item.user ?? '',
    event: typeof item.event === 'object' && item.event ? normalizeEvent(item.event) : item.event ?? '',
    showtime: typeof item.showtime === 'object' && item.showtime ? normalizeShowtime(item.showtime) : item.showtime ?? '',
    hall: typeof item.hall === 'object' && item.hall ? normalizeHall(item.hall) : item.hall ?? '',
    seatCode: item.seatCode ?? item.seat?.code ?? '',
    category: item.category ?? item.seat?.category ?? 'STANDARD',
    price: Number(item.price ?? item.seat?.price ?? 0),
    qrToken: item.qrToken ?? item.token ?? item.ticketNumber ?? item.id,
    qrImage: item.qrImage,
    status: item.status ?? raw?.state ?? 'VALID',
    usedAt: item.usedAt
  };
}

export function normalizePayment(raw: any): Payment {
  const item = normalizeId(raw?.payment ?? raw?.item ?? raw);
  return {
    id: item.id,
    paymentNumber: item.paymentNumber ?? item.id,
    booking: item.booking ?? '',
    user: item.user ?? '',
    provider: item.provider ?? 'MOCK',
    method: item.method ?? 'CARD',
    amount: Number(item.amount ?? 0),
    currency: item.currency ?? 'TRY',
    status: item.status ?? 'PENDING',
    providerTransactionId: item.providerTransactionId,
    paidAt: item.paidAt,
    createdAt: item.createdAt ?? new Date().toISOString()
  };
}

export function normalizeRefund(raw: any): Refund {
  const item = normalizeId(raw?.refund ?? raw?.item ?? raw);
  return {
    id: item.id,
    refundNumber: item.refundNumber ?? item.id,
    booking: item.booking ?? '',
    payment: item.payment,
    user: item.user ?? '',
    amount: Number(item.amount ?? 0),
    reason: item.reason ?? '',
    status: item.status ?? 'REQUESTED',
    createdAt: item.createdAt ?? new Date().toISOString()
  };
}

export function normalizeDashboard(raw: any): DashboardReport {
  const item = raw?.report ?? raw?.dashboard ?? raw?.item ?? raw ?? {};
  return {
    totalRevenue: Number(item.totalRevenue ?? item.revenue ?? 0),
    ticketsSold: Number(item.ticketsSold ?? item.ticketCount ?? 0),
    occupancyRate: Number(item.occupancyRate ?? item.occupancy ?? 0),
    refundRequests: Number(item.refundRequests ?? item.pendingRefunds ?? 0),
    newUsers: Number(item.newUsers ?? item.users ?? 0),
    upcomingShows: Number(item.upcomingShows ?? item.showtimes ?? 0)
  };
}
