-- ================================================================
-- BİLETAL - PostgreSQL Şeması (Supabase bağımlılığı yok)
-- Docker: bilet_user / Bilet!guclu* / bilet_db / port 5432
-- ================================================================

-- Enums
CREATE TYPE user_role AS ENUM ('customer', 'operator', 'super_admin');
CREATE TYPE hall_type AS ENUM ('masali', 'sinema');
CREATE TYPE seat_status AS ENUM ('empty', 'occupied', 'reserved', 'vip', 'disabled');
CREATE TYPE payment_method AS ENUM ('credit_card', 'cash', 'transfer', 'mobile_payment');
CREATE TYPE payment_status AS ENUM ('successful', 'pending', 'refunded');
CREATE TYPE ticket_status AS ENUM ('active', 'cancelled', 'used', 'expired');
CREATE TYPE session_status AS ENUM ('active', 'cancelled', 'postponed');

-- Users (kimlik doğrulama + profil tek tabloda)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Halls
CREATE TABLE halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hall_type hall_type NOT NULL,
  total_capacity INTEGER NOT NULL,
  masali_table_count INTEGER,
  masali_seats_per_table INTEGER,
  sinema_row_groups TEXT[],
  sinema_rows_per_group INTEGER[],
  sinema_seats_per_row INTEGER[],
  has_corridor BOOLEAN DEFAULT false,
  corridor_after_row INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seats (salon konfigürasyonundan üretilir)
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  seat_label TEXT NOT NULL,
  row_group TEXT,
  row_number INTEGER,
  seat_number INTEGER,
  table_label TEXT,
  seat_status seat_status NOT NULL DEFAULT 'empty',
  price_multiplier DECIMAL(5,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slogan TEXT,
  description TEXT,
  poster_url TEXT,
  cover_url TEXT,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions (Etkinlik + Salon + Tarih/Saat)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status session_status NOT NULL DEFAULT 'active',
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing categories (seans başına)
CREATE TABLE pricing_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  seat_status_filter seat_status NOT NULL DEFAULT 'empty',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing settings (global)
CREATE TABLE pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kdv_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seat_id UUID REFERENCES seats(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  ticket_code TEXT NOT NULL UNIQUE,
  qr_code_data TEXT NOT NULL UNIQUE,
  status ticket_status NOT NULL DEFAULT 'active',
  price DECIMAL(10,2) NOT NULL,
  kdv_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  sold_by UUID REFERENCES users(id),
  is_single_use BOOLEAN NOT NULL DEFAULT true,
  valid_until TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QR scan logs
CREATE TABLE qr_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  scanned_by UUID NOT NULL REFERENCES users(id),
  scan_result TEXT NOT NULL,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notification settings
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  email_from TEXT,
  sms_api_key TEXT,
  sms_sender_name TEXT,
  send_ticket_info BOOLEAN NOT NULL DEFAULT true,
  send_reminder BOOLEAN NOT NULL DEFAULT true,
  send_cancellation_notice BOOLEAN NOT NULL DEFAULT true,
  reminder_hours_before INTEGER NOT NULL DEFAULT 24,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket design
CREATE TABLE ticket_design (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#1e40af',
  secondary_color TEXT NOT NULL DEFAULT '#f59e0b',
  font_family TEXT NOT NULL DEFAULT 'Inter',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_seats_hall_id ON seats(hall_id);
CREATE INDEX idx_sessions_event_id ON sessions(event_id);
CREATE INDEX idx_sessions_hall_id ON sessions(hall_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_tickets_session_id ON tickets(session_id);
CREATE INDEX idx_tickets_seat_id ON tickets(seat_id);
CREATE INDEX idx_tickets_qr_code_data ON tickets(qr_code_data);
CREATE INDEX idx_tickets_ticket_code ON tickets(ticket_code);
CREATE INDEX idx_qr_scan_logs_ticket_id ON qr_scan_logs(ticket_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_users_email ON users(email);

-- Varsayılan fiyatlandırma ayarı
INSERT INTO pricing_settings (kdv_rate, commission_rate, is_active)
VALUES (20.00, 5.00, true);

-- Varsayılan bildirim ayarı
INSERT INTO notification_settings (email_enabled, sms_enabled)
VALUES (false, false);

-- Varsayılan bilet tasarımı
INSERT INTO ticket_design (primary_color, secondary_color, font_family)
VALUES ('#1e40af', '#f59e0b', 'Inter');

-- İlk super admin kullanıcısı (şifre: Admin123!)
-- Şifreyi sunucu çalıştırıldıktan sonra /api/auth/register ile oluşturun
-- veya aşağıdaki hash'i kullanın (bcrypt, 10 rounds)
-- INSERT INTO users (email, password_hash, full_name, role)
-- VALUES ('admin@biletal.com', '$2b$10$...', 'Sistem Yöneticisi', 'super_admin');
