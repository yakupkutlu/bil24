-- ============================================================
-- BİLET ORGANİZASYON VE SATIŞ SİSTEMİ - VERİTABANI ŞEMASI
-- PostgreSQL - Full Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('customer', 'operator', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned');

CREATE TYPE venue_type AS ENUM ('cinema', 'table');
CREATE TYPE seat_status AS ENUM ('available', 'occupied', 'reserved', 'vip', 'disabled', 'blocked');
CREATE TYPE seat_gender AS ENUM ('male', 'female', 'mixed');

CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE session_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');

CREATE TYPE ticket_status AS ENUM ('active', 'used', 'cancelled', 'refunded', 'expired');
CREATE TYPE qr_type AS ENUM ('single_use', 'time_limited');

CREATE TYPE payment_method AS ENUM ('credit_card', 'bank_transfer', 'cash', 'mobile_payment');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

CREATE TYPE notification_type AS ENUM ('email', 'sms', 'push');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

CREATE TYPE language_code AS ENUM ('tr', 'en');

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    status user_status NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    preferred_language language_code DEFAULT 'tr',
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    refresh_token_hash VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================
-- REFRESH TOKENS TABLE
-- ============================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ============================================================
-- SYSTEM SETTINGS TABLE
-- ============================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Default settings
INSERT INTO system_settings (key, value, description) VALUES
    ('vat_rate', '18', 'KDV Oranı (%)'),
    ('commission_rate', '5', 'Komisyon Oranı (%)'),
    ('default_language', 'tr', 'Varsayılan Dil'),
    ('default_currency', 'TRY', 'Varsayılan Para Birimi'),
    ('smtp_host', '', 'SMTP Sunucu Adresi'),
    ('smtp_port', '587', 'SMTP Port'),
    ('smtp_user', '', 'SMTP Kullanıcı'),
    ('sms_api_key', '', 'SMS API Anahtarı'),
    ('send_email_on_purchase', 'true', 'Satın alma sonrası e-posta gönder'),
    ('send_sms_on_purchase', 'false', 'Satın alma sonrası SMS gönder'),
    ('send_reminder_email', 'true', 'Etkinlik hatırlatma e-postası gönder'),
    ('ticket_logo_url', '', 'Bilet Logo URL'),
    ('ticket_primary_color', '#1a1a2e', 'Bilet Ana Rengi'),
    ('ticket_font', 'Roboto', 'Bilet Yazı Tipi'),
    ('company_name', 'Bilet Sistemi', 'Şirket Adı'),
    ('company_phone', '', 'Şirket Telefonu'),
    ('company_email', '', 'Şirket E-postası'),
    ('company_address', '', 'Şirket Adresi'),
    ('company_logo_url', '', 'Şirket Logo URL');

-- ============================================================
-- VENUES TABLE
-- ============================================================

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type venue_type NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    capacity INTEGER NOT NULL DEFAULT 0,
    floor_plan_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    -- Cinema layout config
    cinema_config JSONB,  -- { groups: [{letter: 'A', rows: 5, seats_per_row: 10, aisle_after: [5]}] }
    -- Table layout config
    table_config JSONB,   -- { tables: [{number: 'A1', seats: 8}], tables_per_row: 4 }
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_venues_type ON venues(type);
CREATE INDEX idx_venues_is_active ON venues(is_active);

-- ============================================================
-- SEATS TABLE
-- ============================================================

CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    -- Cinema: group='A', row=1, number=5 => 'A1-5'
    -- Table: group='A', row=1 (table), number=3 (seat) => 'A1-3'
    seat_code VARCHAR(20) NOT NULL,  -- e.g. 'A1-5' or 'A1-3'
    group_letter VARCHAR(5),         -- 'A', 'B', 'C'
    row_number INTEGER,              -- row in group
    seat_number INTEGER,             -- seat in row
    table_number VARCHAR(10),        -- for table type: 'A1', 'B2'
    seat_type seat_status DEFAULT 'available',
    is_vip BOOLEAN DEFAULT false,
    is_disabled_accessible BOOLEAN DEFAULT false,
    x_position DECIMAL(8,2),         -- for visual layout
    y_position DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(venue_id, seat_code)
);

CREATE INDEX idx_seats_venue_id ON seats(venue_id);
CREATE INDEX idx_seats_seat_code ON seats(seat_code);
CREATE INDEX idx_seats_seat_type ON seats(seat_type);

-- ============================================================
-- EVENTS TABLE
-- ============================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    title_en VARCHAR(500),
    slug VARCHAR(500) UNIQUE,
    slogan VARCHAR(500),
    slogan_en VARCHAR(500),
    description TEXT,
    description_en TEXT,
    category VARCHAR(100),
    poster_url TEXT,
    cover_image_url TEXT,
    gallery_urls JSONB DEFAULT '[]',
    organizer_name VARCHAR(255),
    organizer_contact VARCHAR(255),
    tags TEXT[],
    status event_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    min_age INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_is_featured ON events(is_featured);

-- ============================================================
-- SESSIONS (PROGRAMS / SEANSLAR) TABLE
-- ============================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INTEGER,
    status session_status DEFAULT 'scheduled',
    notes TEXT,
    -- Pricing per session
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    vip_price DECIMAL(10,2),
    student_price DECIMAL(10,2),
    vat_rate DECIMAL(5,2) DEFAULT 18,
    commission_rate DECIMAL(5,2) DEFAULT 5,
    -- Capacity
    total_capacity INTEGER NOT NULL DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    reserved_count INTEGER DEFAULT 0,
    available_count INTEGER GENERATED ALWAYS AS (total_capacity - sold_count - reserved_count) STORED,
    -- Settings
    seat_selection_enabled BOOLEAN DEFAULT true,
    max_tickets_per_person INTEGER DEFAULT 10,
    sale_start_at TIMESTAMP,
    sale_end_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_event_id ON sessions(event_id);
CREATE INDEX idx_sessions_venue_id ON sessions(venue_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_status ON sessions(status);

-- ============================================================
-- SESSION PRICE CATEGORIES
-- ============================================================

CREATE TABLE session_price_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    color_code VARCHAR(7),
    max_quantity INTEGER,
    sold_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_price_categories_session_id ON session_price_categories(session_id);

-- ============================================================
-- SESSION SEATS (per-session seat state)
-- ============================================================

CREATE TABLE session_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    status seat_status DEFAULT 'available',
    price_category_id UUID REFERENCES session_price_categories(id),
    ticket_id UUID,  -- filled when sold
    reserved_at TIMESTAMP,
    reserved_until TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, seat_id)
);

CREATE INDEX idx_session_seats_session_id ON session_seats(session_id);
CREATE INDEX idx_session_seats_seat_id ON session_seats(seat_id);
CREATE INDEX idx_session_seats_status ON session_seats(status);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    -- Payment gateway info
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    -- Cash/transfer info
    operator_id UUID REFERENCES users(id),
    operator_notes TEXT,
    receipt_number VARCHAR(100),
    -- Refund info
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    refund_amount DECIMAL(10,2),
    -- Metadata
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ============================================================
-- TICKETS TABLE
-- ============================================================

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    session_id UUID NOT NULL REFERENCES sessions(id),
    payment_id UUID REFERENCES payments(id),
    owner_user_id UUID REFERENCES users(id),
    -- Buyer info (for non-registered users)
    buyer_first_name VARCHAR(100),
    buyer_last_name VARCHAR(100),
    buyer_email VARCHAR(255),
    buyer_phone VARCHAR(20),
    -- Seat info
    seat_id UUID REFERENCES seats(id),
    seat_code VARCHAR(20),
    seat_label VARCHAR(50),  -- Human readable: "A Grubu, 1. Sıra, 5. Koltuk"
    seat_label_en VARCHAR(50),
    price_category_id UUID REFERENCES session_price_categories(id),
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    vat_amount DECIMAL(10,2) DEFAULT 0,
    commission_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    -- QR Code
    qr_code TEXT NOT NULL,
    qr_type qr_type DEFAULT 'single_use',
    qr_expires_at TIMESTAMP,
    -- Status
    status ticket_status DEFAULT 'active',
    -- Scan info
    scanned_at TIMESTAMP,
    scanned_by UUID REFERENCES users(id),
    scan_count INTEGER DEFAULT 0,
    -- Files
    pdf_url TEXT,
    image_url TEXT,
    -- Cancellation
    cancelled_at TIMESTAMP,
    cancelled_by UUID REFERENCES users(id),
    cancel_reason TEXT,
    refund_amount DECIMAL(10,2),
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),  -- operator or system
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_session_id ON tickets(session_id);
CREATE INDEX idx_tickets_payment_id ON tickets(payment_id);
CREATE INDEX idx_tickets_owner_user_id ON tickets(owner_user_id);
CREATE INDEX idx_tickets_seat_id ON tickets(seat_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_qr_code ON tickets(qr_code);

-- ============================================================
-- TICKET SCAN LOGS
-- ============================================================

CREATE TABLE ticket_scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    scanned_by UUID REFERENCES users(id),
    scan_result VARCHAR(20) NOT NULL,  -- 'success', 'already_used', 'invalid', 'expired'
    scan_notes TEXT,
    ip_address VARCHAR(45),
    device_info TEXT,
    scanned_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_scan_logs_ticket_id ON ticket_scan_logs(ticket_id);
CREATE INDEX idx_ticket_scan_logs_scanned_at ON ticket_scan_logs(scanned_at);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    ticket_id UUID REFERENCES tickets(id),
    session_id UUID REFERENCES sessions(id),
    type notification_type NOT NULL,
    status notification_status DEFAULT 'pending',
    subject VARCHAR(500),
    body TEXT,
    recipient VARCHAR(255) NOT NULL,  -- email or phone
    sent_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number = 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_ticket BEFORE INSERT ON tickets
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Update session sold_count when ticket created/cancelled
CREATE OR REPLACE FUNCTION update_session_sold_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE sessions SET sold_count = sold_count + 1 WHERE id = NEW.session_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'active' AND NEW.status IN ('cancelled', 'refunded') THEN
            UPDATE sessions SET sold_count = sold_count - 1 WHERE id = NEW.session_id;
        ELSIF OLD.status IN ('cancelled', 'refunded') AND NEW.status = 'active' THEN
            UPDATE sessions SET sold_count = sold_count + 1 WHERE id = NEW.session_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_ticket_change AFTER INSERT OR UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_session_sold_count();

-- Auto-generate event slug
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        base_slug = LOWER(REGEXP_REPLACE(
            REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        ));
        final_slug = base_slug;
        WHILE EXISTS (SELECT 1 FROM events WHERE slug = final_slug AND id != NEW.id) LOOP
            counter = counter + 1;
            final_slug = base_slug || '-' || counter;
        END LOOP;
        NEW.slug = final_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_event BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION generate_event_slug();

-- ============================================================
-- VIEWS
-- ============================================================

-- Session summary view
CREATE OR REPLACE VIEW v_session_summary AS
SELECT
    s.id AS session_id,
    e.id AS event_id,
    e.title AS event_title,
    e.poster_url,
    e.category,
    v.id AS venue_id,
    v.name AS venue_name,
    v.type AS venue_type,
    v.city,
    s.session_date,
    s.start_time,
    s.end_time,
    s.duration_minutes,
    s.status,
    s.base_price,
    s.vip_price,
    s.vat_rate,
    s.commission_rate,
    s.total_capacity,
    s.sold_count,
    s.reserved_count,
    s.available_count,
    s.seat_selection_enabled,
    ROUND((s.sold_count::DECIMAL / NULLIF(s.total_capacity, 0)) * 100, 2) AS occupancy_rate
FROM sessions s
JOIN events e ON e.id = s.event_id
JOIN venues v ON v.id = s.venue_id;

-- Daily sales report view
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT
    DATE(p.created_at) AS sale_date,
    COUNT(t.id) AS ticket_count,
    SUM(p.amount) AS total_amount,
    SUM(p.vat_amount) AS total_vat,
    SUM(p.commission_amount) AS total_commission,
    SUM(p.net_amount) AS total_net,
    COUNT(CASE WHEN p.method = 'credit_card' THEN 1 END) AS credit_card_sales,
    COUNT(CASE WHEN p.method = 'cash' THEN 1 END) AS cash_sales,
    COUNT(CASE WHEN p.method = 'bank_transfer' THEN 1 END) AS transfer_sales,
    SUM(CASE WHEN p.method = 'credit_card' THEN p.amount ELSE 0 END) AS credit_card_amount,
    SUM(CASE WHEN p.method = 'cash' THEN p.amount ELSE 0 END) AS cash_amount,
    SUM(CASE WHEN p.method = 'bank_transfer' THEN p.amount ELSE 0 END) AS transfer_amount
FROM payments p
JOIN tickets t ON t.payment_id = p.id
WHERE p.status = 'completed'
GROUP BY DATE(p.created_at)
ORDER BY sale_date DESC;

-- ============================================================
-- SEED DATA - SUPER ADMIN
-- ============================================================

-- Default super admin user (password: Admin123!)
INSERT INTO users (
    email, phone, password_hash, first_name, last_name, role, status, email_verified
) VALUES (
    'admin@biletsistemi.com',
    '+905001234567',
    '$2b$10$rQjJ.K8VQZ.P1wQgWNOlXuuEsHvP.N2K3ZxKQvAh8cJHs3lGPmHM2',  -- Admin123!
    'Sistem',
    'Yöneticisi',
    'super_admin',
    'active',
    true
);
