-- ================================================================
-- ebilet24 / BİLETAL — PostgreSQL Şeması
-- Versiyon: 2.1  |  2026-06-09
-- Bağlantı: bilet_user / Bilet!guclu* / bilet_db / 5432
-- Not: Tablo başına IF NOT EXISTS — yeniden çalıştırılabilir.
-- ENUM'lar için DO bloğu kullanılır (PostgreSQL 9.3+).
-- ================================================================

-- ── ENUM TİPLERİ ─────────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE user_role      AS ENUM ('customer','operator','super_admin');               EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE hall_type      AS ENUM ('masali','sinema');                                 EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE seat_status    AS ENUM ('empty','occupied','reserved','vip','disabled');    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('credit_card','cash','transfer','mobile_payment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('successful','pending','refunded');                 EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_status  AS ENUM ('active','cancelled','used','expired');             EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE session_status AS ENUM ('active','cancelled','postponed');                  EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── TABLOLAR ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS halls (
  id                     UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT      NOT NULL,
  hall_type              hall_type NOT NULL,
  total_capacity         INTEGER   NOT NULL,
  -- Masalı salon
  masali_table_count     INTEGER,
  masali_seats_per_table INTEGER,
  -- Sinema salonu
  sinema_row_groups      TEXT[],
  sinema_rows_per_group  INTEGER[],
  sinema_seats_per_row   INTEGER[],
  has_corridor           BOOLEAN     DEFAULT false,
  corridor_after_row     INTEGER,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seats (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id          UUID        NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  seat_label       TEXT        NOT NULL,
  row_group        TEXT,
  row_number       INTEGER,
  seat_number      INTEGER,
  table_label      TEXT,
  seat_status      seat_status NOT NULL DEFAULT 'empty',
  price_multiplier DECIMAL(5,2) DEFAULT 1.00,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
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

CREATE TABLE IF NOT EXISTS sessions (
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

-- Altın / Gümüş / Bronz ve özel kategoriler (seans başına)
CREATE TABLE IF NOT EXISTS pricing_categories (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID          NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  category_name      TEXT          NOT NULL,        -- 'Altın Kategori', 'Gümüş Kategori', 'Bronz Kategori'
  seat_status_filter seat_status   NOT NULL DEFAULT 'empty',
  price              DECIMAL(10,2) NOT NULL,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- KDV ve komisyon oranı (tek satır tutulur)
CREATE TABLE IF NOT EXISTS pricing_settings (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  kdv_rate        DECIMAL(5,2)  NOT NULL DEFAULT 20.00,
  commission_rate DECIMAL(5,2)  NOT NULL DEFAULT 5.00,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
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

CREATE TABLE IF NOT EXISTS qr_scan_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID        NOT NULL REFERENCES tickets(id)  ON DELETE CASCADE,
  scanned_by   UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  scan_result  TEXT        NOT NULL,
  is_duplicate BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_settings (
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

CREATE TABLE IF NOT EXISTS ticket_design (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url        TEXT,
  primary_color   TEXT        NOT NULL DEFAULT '#1e40af',
  secondary_color TEXT        NOT NULL DEFAULT '#f59e0b',
  font_family     TEXT        NOT NULL DEFAULT 'Inter',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL,
  entity_type TEXT        NOT NULL,
  entity_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS API ayarları (İleti Merkezi + Twilio çoklu sağlayıcı)
CREATE TABLE IF NOT EXISTS sms_settings (
  id                 SERIAL       PRIMARY KEY,
  active_provider    VARCHAR(20)  NOT NULL DEFAULT 'iletimerkezi',
  -- İleti Merkezi
  im_sender          VARCHAR(20),
  im_api_key         VARCHAR(255),
  im_hash_key        VARCHAR(255),
  -- Twilio
  twilio_account_sid VARCHAR(255),
  twilio_auth_token  VARCHAR(255),
  twilio_from        VARCHAR(30),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── MİGRASYON: mevcut sms_settings tablosunu güncelle ────────────────────────
-- (Eski kurulumda sadece sender/api_key/hash_key vardı — yeni sütunları ekle)

ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS active_provider    VARCHAR(20)  NOT NULL DEFAULT 'iletimerkezi';
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS im_sender          VARCHAR(20);
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS im_api_key         VARCHAR(255);
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS im_hash_key        VARCHAR(255);
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS twilio_account_sid VARCHAR(255);
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS twilio_auth_token  VARCHAR(255);
ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS twilio_from        VARCHAR(30);

-- Eski sütunlardaki veriyi yeni sütunlara taşı (bir kere çalışır)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='sms_settings' AND column_name='api_key'
  ) THEN
    UPDATE sms_settings
    SET im_sender  = sender,
        im_api_key = api_key,
        im_hash_key = hash_key
    WHERE im_api_key IS NULL AND api_key IS NOT NULL;
  END IF;
END $$;

-- ── İNDEKSLER ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);
CREATE INDEX IF NOT EXISTS idx_seats_hall_id           ON seats(hall_id);
CREATE INDEX IF NOT EXISTS idx_seats_status            ON seats(seat_status);
CREATE INDEX IF NOT EXISTS idx_sessions_event_id       ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_hall_id        ON sessions(hall_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date           ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status         ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_pricing_cats_session    ON pricing_categories(session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_session_id      ON tickets(session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_seat_id         ON tickets(seat_id);
CREATE INDEX IF NOT EXISTS idx_tickets_sold_by         ON tickets(sold_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status          ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code_data    ON tickets(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code     ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_ticket_id  ON qr_scan_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id   ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity    ON activity_logs(entity_type, entity_id);

-- ── VARSAYILAN VERİLER (yoksa ekle) ──────────────────────────────────────────

INSERT INTO pricing_settings (kdv_rate, commission_rate, is_active)
SELECT 20.00, 5.00, true
WHERE NOT EXISTS (SELECT 1 FROM pricing_settings);

INSERT INTO notification_settings (email_enabled, sms_enabled)
SELECT false, false
WHERE NOT EXISTS (SELECT 1 FROM notification_settings);

INSERT INTO ticket_design (primary_color, secondary_color, font_family)
SELECT '#1e40af', '#f59e0b', 'Inter'
WHERE NOT EXISTS (SELECT 1 FROM ticket_design);

-- ── İLK SUPER ADMIN ──────────────────────────────────────────────────────────
-- Geçici şifre: Admin123!  (bcrypt 10 tur)
-- Sisteme ilk girişten sonra Profil Ayarları > Şifre Değiştir bölümünden güncelleyin.

INSERT INTO users (email, password_hash, full_name, role)
SELECT 'admin@biletal.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Sistem Yöneticisi', 'super_admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@biletal.com');
