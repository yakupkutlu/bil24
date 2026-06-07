export type UserRole = 'customer' | 'operator' | 'super_admin';
export type HallType = 'masali' | 'sinema';
export type SeatStatus = 'empty' | 'occupied' | 'reserved' | 'vip' | 'disabled';
export type PaymentMethod = 'credit_card' | 'cash' | 'transfer' | 'mobile_payment';
export type PaymentStatus = 'successful' | 'pending' | 'refunded';
export type TicketStatus = 'active' | 'cancelled' | 'used' | 'expired';
export type SessionStatusType = 'active' | 'cancelled' | 'postponed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hall {
  id: string;
  name: string;
  hall_type: HallType;
  total_capacity: number;
  masali_table_count: number | null;
  masali_seats_per_table: number | null;
  sinema_row_groups: string[] | null;
  sinema_rows_per_group: number[] | null;
  sinema_seats_per_row: number[] | null;
  has_corridor: boolean;
  corridor_after_row: number | null;
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  hall_id: string;
  seat_label: string;
  row_group: string | null;
  row_number: number | null;
  seat_number: number | null;
  table_label: string | null;
  seat_status: SeatStatus;
  price_multiplier: number;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  slogan: string | null;
  description: string | null;
  poster_url: string | null;
  cover_url: string | null;
  category: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  event_id: string;
  hall_id: string;
  session_date: string;
  start_time: string;
  duration_minutes: number;
  status: SessionStatusType;
  base_price: number;
  created_at: string;
  updated_at: string;
  event?: Event;
  hall?: Hall;
}

export interface PricingCategory {
  id: string;
  session_id: string;
  category_name: string;
  seat_status_filter: SeatStatus;
  price: number;
  created_at: string;
}

export interface PricingSettings {
  id: string;
  kdv_rate: number;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  session_id: string;
  seat_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  ticket_code: string;
  qr_code_data: string;
  status: TicketStatus;
  price: number;
  kdv_amount: number;
  commission_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  sold_by: string | null;
  is_single_use: boolean;
  valid_until: string | null;
  used_at: string | null;
  created_at: string;
  updated_at: string;
  session?: Session;
  seat?: Seat;
}

export interface QRScanLog {
  id: string;
  ticket_id: string;
  scanned_by: string;
  scan_result: string;
  is_duplicate: boolean;
  created_at: string;
  ticket?: Ticket;
}

export interface NotificationSettings {
  id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  email_from: string | null;
  sms_api_key: string | null;
  sms_sender_name: string | null;
  send_ticket_info: boolean;
  send_reminder: boolean;
  send_cancellation_notice: boolean;
  reminder_hours_before: number;
  updated_at: string;
}

export interface TicketDesign {
  id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: 'Kredi Kartı',
  cash: 'Nakit',
  transfer: 'Havale/EFT',
  mobile_payment: 'Mobil Ödeme',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  successful: 'Başarılı',
  pending: 'Beklemede',
  refunded: 'İade Edildi',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  active: 'Aktif',
  cancelled: 'İptal',
  used: 'Kullanıldı',
  expired: 'Süresi Doldu',
};

export const SEAT_STATUS_LABELS: Record<SeatStatus, string> = {
  empty: 'Boş',
  occupied: 'Dolu',
  reserved: 'Rezerve',
  vip: 'VIP',
  disabled: 'Engelli',
};

export const SESSION_STATUS_LABELS: Record<SessionStatusType, string> = {
  active: 'Aktif',
  cancelled: 'İptal',
  postponed: 'Ertelendi',
};

export const HALL_TYPE_LABELS: Record<HallType, string> = {
  masali: 'Masalı Düzen',
  sinema: 'Sinema Düzeni',
};
