// ============================================================
// TYPES - TypeScript Interfaces
// ============================================================

export type UserRole = 'customer' | 'operator' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'banned';
export type VenueType = 'cinema' | 'table';
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'vip' | 'disabled' | 'blocked' | 'selected';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type TicketStatus = 'active' | 'used' | 'cancelled' | 'refunded' | 'expired';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'mobile_payment';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type QrType = 'single_use' | 'time_limited';
export type Language = 'tr' | 'en';

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  preferredLanguage: Language;
  emailNotifications: boolean;
  smsNotifications: boolean;
  lastLoginAt?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

export interface CinemaGroupConfig {
  letter: string;
  rows: number;
  seatsPerRow: number;
  isVip?: boolean;
  aisleAfter?: number[];
}

export interface TableConfig {
  number: string;
  seats: number;
}

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  description?: string;
  address?: string;
  city?: string;
  capacity: number;
  floorPlanImageUrl?: string;
  isActive: boolean;
  cinemaConfig?: { groups: CinemaGroupConfig[] };
  tableConfig?: { tables: TableConfig[]; tablesPerRow?: number };
  seats?: Seat[];
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  id: string;
  venueId: string;
  seatCode: string;
  groupLetter?: string;
  rowNumber?: number;
  seatNumber?: number;
  tableNumber?: string;
  seatType: SeatStatus;
  isVip: boolean;
  isDisabledAccessible: boolean;
  xPosition?: number;
  yPosition?: number;
}

export interface Event {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  slogan?: string;
  sloganEn?: string;
  description?: string;
  descriptionEn?: string;
  category?: string;
  posterUrl?: string;
  coverImageUrl?: string;
  galleryUrls: string[];
  organizerName?: string;
  organizerContact?: string;
  tags?: string[];
  status: EventStatus;
  isFeatured: boolean;
  minAge: number;
  durationMinutes?: number;
  sessions?: Session[];
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  eventId: string;
  venueId: string;
  event?: Event;
  venue?: Venue;
  sessionDate: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  status: SessionStatus;
  notes?: string;
  basePrice: number;
  vipPrice?: number;
  studentPrice?: number;
  vatRate: number;
  commissionRate: number;
  totalCapacity: number;
  soldCount: number;
  reservedCount: number;
  availableCount: number;
  seatSelectionEnabled: boolean;
  maxTicketsPerPerson: number;
  saleStartAt?: string;
  saleEndAt?: string;
  priceCategories?: SessionPriceCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionPriceCategory {
  id: string;
  sessionId: string;
  name: string;
  nameEn?: string;
  price: number;
  description?: string;
  colorCode?: string;
  maxQuantity?: number;
  soldQuantity: number;
  isActive: boolean;
}

export interface SessionSeatMap {
  seatId: string;
  seatCode: string;
  groupLetter?: string;
  rowNumber?: number;
  seatNumber?: number;
  tableNumber?: string;
  status: SeatStatus;
  isVip: boolean;
  isDisabledAccessible: boolean;
  xPosition?: number;
  yPosition?: number;
}

export interface Payment {
  id: string;
  userId?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  vatAmount: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  gatewayTransactionId?: string;
  operatorId?: string;
  operatorNotes?: string;
  receiptNumber?: string;
  refundedAt?: string;
  refundReason?: string;
  refundAmount?: number;
  tickets?: Ticket[];
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  sessionId: string;
  session?: Session;
  paymentId?: string;
  payment?: Payment;
  ownerUserId?: string;
  ownerUser?: User;
  buyerFirstName: string;
  buyerLastName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  seatId?: string;
  seat?: Seat;
  seatCode?: string;
  seatLabel?: string;
  seatLabelEn?: string;
  priceCategoryId?: string;
  basePrice: number;
  vatAmount: number;
  commissionAmount: number;
  totalPrice: number;
  qrCode: string;
  qrType: QrType;
  qrExpiresAt?: string;
  status: TicketStatus;
  scannedAt?: string;
  scannedBy?: string;
  scanCount: number;
  pdfUrl?: string;
  imageUrl?: string;
  cancelledAt?: string;
  cancelReason?: string;
  refundAmount?: number;
  notes?: string;
  scanLogs?: TicketScanLog[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketScanLog {
  id: string;
  ticketId: string;
  scannedBy?: string;
  scannedByUser?: User;
  scanResult: 'success' | 'already_used' | 'invalid' | 'expired';
  scanNotes?: string;
  ipAddress?: string;
  scannedAt: string;
}

export interface ScanResult {
  success: boolean;
  result: 'success' | 'already_used' | 'invalid' | 'expired';
  message: string;
  ticket?: Partial<Ticket> & {
    buyerName?: string;
    event?: string;
    venue?: string;
    sessionDate?: string;
    sessionTime?: string;
  };
  scannedAt?: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export interface DailySalesReport {
  saleDate: string;
  ticketCount: number;
  totalAmount: number;
  totalVat: number;
  totalCommission: number;
  totalNet: number;
  creditCardCount: number;
  cashCount: number;
  transferCount: number;
  creditCardAmount: number;
  cashAmount: number;
  transferAmount: number;
}

export interface OccupancyReport {
  sessionId: string;
  sessionDate: string;
  startTime: string;
  totalCapacity: number;
  soldCount: number;
  reservedCount: number;
  eventTitle: string;
  venueName: string;
  occupancyRate: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
