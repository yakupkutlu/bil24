-- ================================================================
-- ebilet24 / BİLETAL — TAM KURULUM SCRIPTI
-- ⚠️  DİKKAT: Tüm verileri siler ve sıfırdan oluşturur!
-- Kullanım: pgAdmin veya Coolify DB terminali üzerinden çalıştırın.
-- ================================================================

-- ── 1. MEVCUT TABLOLARI SİL ──────────────────────────────────────
DROP TABLE IF EXISTS activity_logs         CASCADE;
DROP TABLE IF EXISTS sms_settings          CASCADE;
DROP TABLE IF EXISTS ticket_design         CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS qr_scan_logs          CASCADE;
DROP TABLE IF EXISTS tickets               CASCADE;
DROP TABLE IF EXISTS pricing_categories    CASCADE;
DROP TABLE IF EXISTS pricing_settings      CASCADE;
DROP TABLE IF EXISTS sessions              CASCADE;
DROP TABLE IF EXISTS events                CASCADE;
DROP TABLE IF EXISTS seats                 CASCADE;
DROP TABLE IF EXISTS halls                 CASCADE;
DROP TABLE IF EXISTS users                 CASCADE;

-- ── 2. ENUM TİPLERİNİ SİL ────────────────────────────────────────
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS ticket_status  CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS seat_status    CASCADE;
DROP TYPE IF EXISTS hall_type      CASCADE;
DROP TYPE IF EXISTS user_role      CASCADE;

-- ── 3. ENUM TİPLERİNİ OLUŞTUR ────────────────────────────────────
DO $$ BEGIN CREATE TYPE user_role      AS ENUM ('customer','operator','super_admin');               EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE hall_type      AS ENUM ('masali','sinema');                                 EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE seat_status    AS ENUM ('empty','occupied','reserved','vip','disabled');    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('credit_card','cash','transfer','mobile_payment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('successful','pending','refunded');                 EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_status  AS ENUM ('active','cancelled','used','expired');             EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE session_status AS ENUM ('active','cancelled','postponed');                  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. TABLOLARI OLUŞTUR ──────────────────────────────────────────

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  full_name     TEXT        NOT NULL,
  phone         TEXT,
  role          user_role   NOT NULL DEFAULT 'customer',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE halls (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT        NOT NULL,
  hall_type              hall_type   NOT NULL,
  total_capacity         INTEGER     NOT NULL,
  masali_table_count     INTEGER,
  masali_seats_per_table INTEGER,
  sinema_row_groups      TEXT[],
  sinema_rows_per_group  INTEGER[],
  sinema_seats_per_row   INTEGER[],
  has_corridor           BOOLEAN     DEFAULT false,
  corridor_after_row     INTEGER,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE seats (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id          UUID         NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  seat_label       TEXT         NOT NULL,
  row_group        TEXT,
  row_number       INTEGER,
  seat_number      INTEGER,
  table_label      TEXT,
  seat_status      seat_status  NOT NULL DEFAULT 'empty',
  price_multiplier DECIMAL(5,2) DEFAULT 1.00,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  slogan      TEXT,
  description TEXT,
  poster_url  TEXT,
  cover_url   TEXT,
  category    TEXT,
  start_date  DATE        NOT NULL,
  end_date    DATE,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID           NOT NULL REFERENCES events(id)  ON DELETE CASCADE,
  hall_id          UUID           NOT NULL REFERENCES halls(id)   ON DELETE CASCADE,
  session_date     DATE           NOT NULL,
  start_time       TIME           NOT NULL,
  duration_minutes INTEGER        NOT NULL,
  status           session_status NOT NULL DEFAULT 'active',
  base_price       DECIMAL(10,2)  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE pricing_categories (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID          NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  category_name      TEXT          NOT NULL,
  seat_status_filter seat_status   NOT NULL DEFAULT 'empty',
  price              DECIMAL(10,2) NOT NULL,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE pricing_settings (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  kdv_rate        DECIMAL(5,2)  NOT NULL DEFAULT 20.00,
  commission_rate DECIMAL(5,2)  NOT NULL DEFAULT 5.00,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID           NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seat_id           UUID           REFERENCES seats(id) ON DELETE SET NULL,
  customer_name     TEXT           NOT NULL,
  customer_email    TEXT,
  customer_phone    TEXT,
  ticket_code       TEXT           NOT NULL UNIQUE,
  qr_code_data      TEXT           NOT NULL UNIQUE,
  status            ticket_status  NOT NULL DEFAULT 'active',
  price             DECIMAL(10,2)  NOT NULL,
  kdv_amount        DECIMAL(10,2)  NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10,2)  NOT NULL DEFAULT 0,
  total_amount      DECIMAL(10,2)  NOT NULL,
  payment_method    payment_method NOT NULL,
  payment_status    payment_status NOT NULL DEFAULT 'pending',
  sold_by           UUID           REFERENCES users(id) ON DELETE SET NULL,
  is_single_use     BOOLEAN        NOT NULL DEFAULT true,
  valid_until       TIMESTAMPTZ,
  used_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE qr_scan_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  scanned_by   UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  scan_result  TEXT        NOT NULL,
  is_duplicate BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_settings (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email_enabled            BOOLEAN     NOT NULL DEFAULT false,
  sms_enabled              BOOLEAN     NOT NULL DEFAULT false,
  email_from               TEXT,
  sms_api_key              TEXT,
  sms_sender_name          TEXT,
  send_ticket_info         BOOLEAN     NOT NULL DEFAULT true,
  send_reminder            BOOLEAN     NOT NULL DEFAULT true,
  send_cancellation_notice BOOLEAN     NOT NULL DEFAULT true,
  reminder_hours_before    INTEGER     NOT NULL DEFAULT 24,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticket_design (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url        TEXT,
  primary_color   TEXT        NOT NULL DEFAULT '#1e40af',
  secondary_color TEXT        NOT NULL DEFAULT '#f59e0b',
  font_family     TEXT        NOT NULL DEFAULT 'Inter',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sms_settings (
  id                 SERIAL       PRIMARY KEY,
  active_provider    VARCHAR(20)  NOT NULL DEFAULT 'iletimerkezi',
  im_sender          VARCHAR(20),
  im_api_key         VARCHAR(255),
  im_hash_key        VARCHAR(255),
  twilio_account_sid VARCHAR(255),
  twilio_auth_token  VARCHAR(255),
  twilio_from        VARCHAR(30),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── 5. İNDEKSLER ─────────────────────────────────────────────────
CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_seats_hall_id          ON seats(hall_id);
CREATE INDEX idx_seats_status           ON seats(seat_status);
CREATE INDEX idx_sessions_event_id      ON sessions(event_id);
CREATE INDEX idx_sessions_hall_id       ON sessions(hall_id);
CREATE INDEX idx_sessions_date          ON sessions(session_date);
CREATE INDEX idx_sessions_status        ON sessions(status);
CREATE INDEX idx_pricing_cats_session   ON pricing_categories(session_id);
CREATE INDEX idx_tickets_session_id     ON tickets(session_id);
CREATE INDEX idx_tickets_seat_id        ON tickets(seat_id);
CREATE INDEX idx_tickets_sold_by        ON tickets(sold_by);
CREATE INDEX idx_tickets_status         ON tickets(status);
CREATE INDEX idx_tickets_qr_code_data   ON tickets(qr_code_data);
CREATE INDEX idx_tickets_ticket_code    ON tickets(ticket_code);
CREATE INDEX idx_qr_scan_logs_ticket_id ON qr_scan_logs(ticket_id);
CREATE INDEX idx_activity_logs_user_id  ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity   ON activity_logs(entity_type, entity_id);

-- ── 6. VARSAYILAN VERİLER ─────────────────────────────────────────
INSERT INTO pricing_settings (kdv_rate, commission_rate, is_active) VALUES (20.00, 5.00, true);
INSERT INTO notification_settings (email_enabled, sms_enabled) VALUES (false, false);
INSERT INTO ticket_design (primary_color, secondary_color, font_family) VALUES ('#1e40af', '#f59e0b', 'Inter');

-- ── 7. İLK SUPER ADMIN ───────────────────────────────────────────
-- Şifre: Admin123!  (bcrypt 10 tur)
-- İlk girişten sonra değiştirin!
INSERT INTO users (email, password_hash, full_name, role) VALUES (
  'admin@biletal.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'Sistem Yöneticisi',
  'super_admin'
);

-- ================================================================
-- Kurulum tamamlandı.
-- Giriş: admin@ebilet24.com  /  Admin123!
-- ================================================================
