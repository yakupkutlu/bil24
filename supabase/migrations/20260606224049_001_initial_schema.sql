-- Enums
CREATE TYPE user_role AS ENUM ('customer', 'operator', 'super_admin');
CREATE TYPE hall_type AS ENUM ('masali', 'sinema');
CREATE TYPE seat_status AS ENUM ('empty', 'occupied', 'reserved', 'vip', 'disabled');
CREATE TYPE payment_method AS ENUM ('credit_card', 'cash', 'transfer', 'mobile_payment');
CREATE TYPE payment_status AS ENUM ('successful', 'pending', 'refunded');
CREATE TYPE ticket_status AS ENUM ('active', 'cancelled', 'used', 'expired');
CREATE TYPE session_status AS ENUM ('active', 'cancelled', 'postponed');

-- Users table (extends Supabase auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
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

-- Seats (generated from hall configuration)
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
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions (Event + Hall + Date/Time)
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

-- Pricing categories per session
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
  sold_by UUID REFERENCES profiles(id),
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
  scanned_by UUID NOT NULL REFERENCES profiles(id),
  scan_result TEXT NOT NULL,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications settings
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

-- Ticket customization
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
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_design ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "delete_profile_admin" ON profiles FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Halls policies (admin manages, operator reads)
CREATE POLICY "select_halls" ON halls FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_halls_admin" ON halls FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "update_halls_admin" ON halls FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "delete_halls_admin" ON halls FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));

-- Seats policies
CREATE POLICY "select_seats" ON seats FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_seats_admin" ON seats FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "update_seats_admin" ON seats FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'operator')));
CREATE POLICY "delete_seats_admin" ON seats FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));

-- Events policies
CREATE POLICY "select_events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_events_admin" ON events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "update_events_admin" ON events FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "delete_events_admin" ON events FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));

-- Sessions policies
CREATE POLICY "select_sessions" ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_sessions_admin" ON sessions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "update_sessions_admin" ON sessions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "delete_sessions_admin" ON sessions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));

-- Pricing categories policies
CREATE POLICY "select_pricing_categories" ON pricing_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_pricing_categories_admin" ON pricing_categories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "update_pricing_categories_admin" ON pricing_categories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "delete_pricing_categories_admin" ON pricing_categories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));

-- Pricing settings policies
CREATE POLICY "select_pricing_settings" ON pricing_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_pricing_settings_admin" ON pricing_settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "update_pricing_settings_admin" ON pricing_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));
CREATE POLICY "delete_pricing_settings_admin" ON pricing_settings FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin')));

-- Tickets policies
CREATE POLICY "select_own_tickets" ON tickets FOR SELECT TO authenticated USING (sold_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'operator')));
CREATE POLICY "insert_tickets" ON tickets FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'operator', 'customer')));
CREATE POLICY "update_tickets" ON tickets FOR UPDATE TO authenticated USING (sold_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'operator')));
CREATE POLICY "delete_tickets_admin" ON tickets FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- QR scan logs policies
CREATE POLICY "select_scan_logs" ON qr_scan_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'operator')));
CREATE POLICY "insert_scan_logs" ON qr_scan_logs FOR INSERT TO authenticated WITH CHECK (scanned_by = auth.uid());
CREATE POLICY "delete_scan_logs_admin" ON qr_scan_logs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Notification settings policies
CREATE POLICY "select_notification_settings" ON notification_settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "insert_notification_settings_admin" ON notification_settings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "update_notification_settings_admin" ON notification_settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Ticket design policies
CREATE POLICY "select_ticket_design" ON ticket_design FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_ticket_design_admin" ON ticket_design FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "update_ticket_design_admin" ON ticket_design FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Activity logs policies
CREATE POLICY "select_activity_logs" ON activity_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'operator')));
CREATE POLICY "insert_activity_logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete_activity_logs_admin" ON activity_logs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- Indexes
CREATE INDEX idx_seats_hall_id ON seats(hall_id);
CREATE INDEX idx_sessions_event_id ON sessions(event_id);
CREATE INDEX idx_sessions_hall_id ON sessions(hall_id);
CREATE INDEX idx_tickets_session_id ON tickets(session_id);
CREATE INDEX idx_tickets_seat_id ON tickets(seat_id);
CREATE INDEX idx_tickets_qr_code_data ON tickets(qr_code_data);
CREATE INDEX idx_tickets_ticket_code ON tickets(ticket_code);
CREATE INDEX idx_qr_scan_logs_ticket_id ON qr_scan_logs(ticket_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
