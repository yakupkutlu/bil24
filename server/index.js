const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'biletal-super-secret-jwt-key-2024';
const SALT_ROUNDS = 10;

// PostgreSQL bağlantı havuzu
const pool = new Pool({
  user: process.env.DB_USER || 'bilet_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bilet_db',
  password: process.env.DB_PASSWORD || 'Bilet!guclu*',
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('connect', () => console.log('PostgreSQL bağlantısı kuruldu'));
pool.on('error', (err) => console.error('PostgreSQL hatası:', err));

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3002')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: izin verilmeyen kaynak: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ─── Dosya Yükleme ────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Sadece resim dosyaları kabul edilir'));
  },
});

app.use('/uploads', express.static(UPLOADS_DIR));

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url, secure_url: url });
});

// ─── Sağlık Kontrolü ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Biletal API çalışıyor', port: PORT });
});

// ─── KURULUM SAYFASI /install ─────────────────────────────────────────────────
// Ortam değişkeni: INSTALL_SECRET — boşsa endpoint devre dışı

const INSTALL_DROP_SQL = `
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
  DROP TYPE IF EXISTS session_status CASCADE;
  DROP TYPE IF EXISTS ticket_status  CASCADE;
  DROP TYPE IF EXISTS payment_status CASCADE;
  DROP TYPE IF EXISTS payment_method CASCADE;
  DROP TYPE IF EXISTS seat_status    CASCADE;
  DROP TYPE IF EXISTS hall_type      CASCADE;
  DROP TYPE IF EXISTS user_role      CASCADE;
`;

const INSTALL_CREATE_SQL = `
  DO $$ BEGIN CREATE TYPE user_role      AS ENUM ('customer','operator','super_admin');              EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE hall_type      AS ENUM ('masali','sinema');                                EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE seat_status    AS ENUM ('empty','occupied','reserved','vip','disabled');   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('credit_card','cash','transfer','mobile_payment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('successful','pending','refunded');                EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE ticket_status  AS ENUM ('active','cancelled','used','expired');            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE session_status AS ENUM ('active','cancelled','postponed');                 EXCEPTION WHEN duplicate_object THEN NULL; END $$;

  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, full_name TEXT NOT NULL, phone TEXT,
    role user_role NOT NULL DEFAULT 'customer', is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, hall_type hall_type NOT NULL,
    total_capacity INTEGER NOT NULL, masali_table_count INTEGER, masali_seats_per_table INTEGER,
    sinema_row_groups TEXT[], sinema_rows_per_group INTEGER[], sinema_seats_per_row INTEGER[],
    has_corridor BOOLEAN DEFAULT false, corridor_after_row INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    seat_label TEXT NOT NULL, row_group TEXT, row_number INTEGER, seat_number INTEGER, table_label TEXT,
    seat_status seat_status NOT NULL DEFAULT 'empty', price_multiplier DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, slogan TEXT, description TEXT,
    poster_url TEXT, cover_url TEXT, category TEXT, start_date DATE NOT NULL, end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true, created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE, session_date DATE NOT NULL,
    start_time TIME NOT NULL, duration_minutes INTEGER NOT NULL,
    status session_status NOT NULL DEFAULT 'active', base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE pricing_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL, seat_status_filter seat_status NOT NULL DEFAULT 'empty',
    price DECIMAL(10,2) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE pricing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), kdv_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00, is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id) ON DELETE SET NULL, customer_name TEXT NOT NULL,
    customer_email TEXT, customer_phone TEXT, ticket_code TEXT NOT NULL UNIQUE,
    qr_code_data TEXT NOT NULL UNIQUE, status ticket_status NOT NULL DEFAULT 'active',
    price DECIMAL(10,2) NOT NULL, kdv_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0, total_amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL, payment_status payment_status NOT NULL DEFAULT 'pending',
    sold_by UUID REFERENCES users(id) ON DELETE SET NULL, is_single_use BOOLEAN NOT NULL DEFAULT true,
    valid_until TIMESTAMPTZ, used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE qr_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    scanned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, scan_result TEXT NOT NULL,
    is_duplicate BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email_enabled BOOLEAN NOT NULL DEFAULT false,
    sms_enabled BOOLEAN NOT NULL DEFAULT false, email_from TEXT, sms_api_key TEXT, sms_sender_name TEXT,
    send_ticket_info BOOLEAN NOT NULL DEFAULT true, send_reminder BOOLEAN NOT NULL DEFAULT true,
    send_cancellation_notice BOOLEAN NOT NULL DEFAULT true, reminder_hours_before INTEGER NOT NULL DEFAULT 24,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE ticket_design (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#1e40af', secondary_color TEXT NOT NULL DEFAULT '#f59e0b',
    font_family TEXT NOT NULL DEFAULT 'Inter', updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id UUID, details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE sms_settings (
    id SERIAL PRIMARY KEY, active_provider VARCHAR(20) NOT NULL DEFAULT 'iletimerkezi',
    im_sender VARCHAR(20), im_api_key VARCHAR(255), im_hash_key VARCHAR(255),
    twilio_account_sid VARCHAR(255), twilio_auth_token VARCHAR(255), twilio_from VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

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

  INSERT INTO pricing_settings (kdv_rate, commission_rate, is_active) VALUES (20.00, 5.00, true);
  INSERT INTO notification_settings (email_enabled, sms_enabled) VALUES (false, false);
  INSERT INTO ticket_design (primary_color, secondary_color, font_family) VALUES ('#1e40af', '#f59e0b', 'Inter');
  INSERT INTO users (email, password_hash, full_name, role) VALUES
    ('admin@biletal.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Sistem Yöneticisi', 'super_admin'),
    ('musteri@biletal.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Test Müşteri',      'customer'),
    ('operator@biletal.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Test Operatör',     'operator');
`;

function installPage(error, success, hideForm) {
  const secret = process.env.INSTALL_SECRET;
  const disabled = !secret;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Veritabanı Kurulum — ebilet24</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.10);padding:36px;max-width:480px;width:100%}
  .logo{font-size:22px;font-weight:800;color:#1d4ed8;letter-spacing:-0.5px;margin-bottom:6px}
  h1{font-size:18px;color:#1e293b;margin-bottom:4px}
  .sub{font-size:13px;color:#64748b;margin-bottom:24px}
  .warn{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:20px;font-size:13px;color:#b91c1c;line-height:1.6}
  .warn strong{display:block;margin-bottom:4px;font-size:14px}
  label{font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px}
  input[type=password]{width:100%;padding:10px 14px;border:1.5px solid #d1d5db;border-radius:10px;font-size:14px;margin-bottom:16px;outline:none;transition:.2s}
  input[type=password]:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
  button{width:100%;padding:12px;background:#dc2626;color:#fff;font-weight:700;border:none;border-radius:10px;font-size:15px;cursor:pointer;transition:.2s}
  button:hover{background:#b91c1c}
  button:disabled{background:#9ca3af;cursor:not-allowed}
  .success{background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;color:#166534;font-size:13px;line-height:1.7}
  .success strong{display:block;font-size:15px;margin-bottom:6px}
  .error{background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:14px;color:#991b1b;font-size:13px;margin-bottom:16px}
  .step{margin-bottom:4px;display:flex;gap:8px}
  .step::before{content:"✓";color:#16a34a;font-weight:bold;flex-shrink:0}
  .login-btn{display:block;margin-top:16px;text-align:center;padding:10px;background:#1d4ed8;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px}
  .disabled-note{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;font-size:13px;color:#64748b;line-height:1.6}
  code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">ebilet24.com</div>
  <h1>Veritabanı Kurulum</h1>
  <p class="sub">Sistemi sıfırlayın ve yeniden kurun</p>

  ${disabled ? `
  <div class="disabled-note">
    <strong>⛔ Kurulum devre dışı</strong><br>
    Bu endpoint'i aktifleştirmek için sunucuda <code>INSTALL_SECRET</code> ortam değişkenini ayarlayın.<br><br>
    <strong>Coolify'da:</strong> Servis → Environment Variables →
    <code>INSTALL_SECRET=gizli-anahtar-buraya</code>
  </div>
  ` : ''}

  ${!disabled && !hideForm ? `
  <div class="warn">
    <strong>⚠️ DİKKAT — Geri Alınamaz İşlem</strong>
    Bu işlem <u>tüm verileri kalıcı olarak siler</u>:<br>
    kullanıcılar, biletler, etkinlikler, salon bilgileri, satış kayıtları.<br>
    Sadece fresh install veya test ortamı sıfırlama için kullanın.
  </div>
  <form method="POST" action="/install" onsubmit="return confirm('TÜM VERİLER SİLİNECEK! Emin misiniz?')">
    <label>Kurulum Anahtarı (INSTALL_SECRET)</label>
    <input type="password" name="key" placeholder="Gizli anahtarı girin" required autofocus />
    <button type="submit">🗑️ Veritabanını Sıfırla ve Yeniden Kur</button>
  </form>
  ` : ''}

  ${error ? `<div class="error">❌ ${error}</div>` : ''}

  ${success ? `
  <div class="success">
    <strong>✅ Kurulum başarıyla tamamlandı!</strong>
    <div class="step">Tüm tablolar silindi</div>
    <div class="step">Şema yeniden oluşturuldu</div>
    <div class="step">Varsayılan ayarlar eklendi</div>
    <div class="step">Admin kullanıcısı oluşturuldu</div>
    <br>
    <strong>Giriş bilgileri:</strong><br>
    📧 admin@ebilet24.com<br>
    🔑 Admin123!<br>
    <em style="font-size:12px;color:#16a34a">İlk girişten sonra şifrenizi değiştirin!</em>
  </div>
  <a href="/" class="login-btn">→ Sisteme Git</a>
  ` : ''}
</div>
</body>
</html>`;
}

app.get('/install', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(installPage(null, false, false));
});

app.post('/install', express.urlencoded({ extended: false }), async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const secret = process.env.INSTALL_SECRET;
  if (!secret) {
    return res.status(403).send(installPage('INSTALL_SECRET ortam değişkeni tanımlı değil.', false, true));
  }
  if (req.body.key !== secret) {
    return res.status(401).send(installPage('Hatalı kurulum anahtarı.', false, false));
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(INSTALL_DROP_SQL);
    await client.query(INSTALL_CREATE_SQL);
    await client.query('COMMIT');
    console.log('✅ Veritabanı kurulumu tamamlandı.');
    res.send(installPage(null, true, true));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Install error:', err.message);
    res.status(500).send(installPage('Kurulum hatası: ' + err.message, false, false));
  } finally {
    client.release();
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() as time, current_database() as db');
    res.json({
      status: 'ok',
      api: 'Biletal API',
      database: rows[0].db,
      db_time: rows[0].time,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Veritabanı bağlantısı kurulamadı', error: err.message });
  }
});

// ─── JWT Middleware ───────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token gerekli' });
  }
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
  }
}

function adminOnly(req, res, next) {
  if (!['super_admin', 'operator'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Yetkisiz erişim' });
  }
  next();
}

function superAdminOnly(req, res, next) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Sadece süper admin erişebilir' });
  }
  next();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, phone, role = 'customer' } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, şifre ve ad soyad zorunludur' });
  }
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Bu email zaten kayıtlı' });
    }
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, phone, role, is_active, created_at, updated_at`,
      [email, password_hash, full_name, phone || null, role]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email ve şifre gerekli' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }
    const { password_hash: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { full_name, phone, current_password, new_password } = req.body;
  const userId = req.user.id;
  try {
    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Mevcut şifre gerekli' });
      const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      const valid = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!valid) return res.status(400).json({ error: 'Mevcut şifre hatalı' });
      const hash = await bcrypt.hash(new_password, 10);
      await pool.query(
        `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone),
         password_hash = $3, updated_at = now() WHERE id = $4`,
        [full_name || null, phone || null, hash, userId]
      );
    } else {
      await pool.query(
        `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone),
         updated_at = now() WHERE id = $3`,
        [full_name || null, phone || null, userId]
      );
    }
    const { rows: updated } = await pool.query(
      'SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── USERS ────────────────────────────────────────────────────────────────────

app.get('/api/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    // Her kullanıcı için bilet sayısını da getir
    const usersWithCount = await Promise.all(rows.map(async (u) => {
      const { rows: tc } = await pool.query('SELECT COUNT(*) FROM tickets WHERE sold_by = $1', [u.id]);
      return { ...u, ticket_count: parseInt(tc[0].count) };
    }));
    res.json(usersWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { role, is_active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET role = COALESCE($1, role), is_active = COALESCE($2, is_active), updated_at = now()
       WHERE id = $3 RETURNING id, email, full_name, phone, role, is_active, created_at, updated_at`,
      [role, is_active, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── HALLS ────────────────────────────────────────────────────────────────────

app.get('/api/halls', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM halls ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/halls/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM halls WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Salon bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/halls', authMiddleware, adminOnly, async (req, res) => {
  const { name, hall_type, total_capacity, masali_table_count, masali_seats_per_table,
    sinema_row_groups, sinema_rows_per_group, sinema_seats_per_row, has_corridor, corridor_after_row } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO halls (name, hall_type, total_capacity, masali_table_count, masali_seats_per_table,
        sinema_row_groups, sinema_rows_per_group, sinema_seats_per_row, has_corridor, corridor_after_row)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, hall_type, total_capacity, masali_table_count || null, masali_seats_per_table || null,
        sinema_row_groups || null, sinema_rows_per_group || null, sinema_seats_per_row || null,
        has_corridor || false, corridor_after_row || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/halls/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, hall_type, total_capacity, masali_table_count, masali_seats_per_table,
    sinema_row_groups, sinema_rows_per_group, sinema_seats_per_row, has_corridor, corridor_after_row } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE halls SET name=$1, hall_type=$2, total_capacity=$3, masali_table_count=$4,
        masali_seats_per_table=$5, sinema_row_groups=$6, sinema_rows_per_group=$7,
        sinema_seats_per_row=$8, has_corridor=$9, corridor_after_row=$10, updated_at=now()
       WHERE id=$11 RETURNING *`,
      [name, hall_type, total_capacity, masali_table_count || null, masali_seats_per_table || null,
        sinema_row_groups || null, sinema_rows_per_group || null, sinema_seats_per_row || null,
        has_corridor || false, corridor_after_row || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Salon bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/halls/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM seats WHERE hall_id = $1', [req.params.id]);
    await pool.query('DELETE FROM halls WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEATS ────────────────────────────────────────────────────────────────────

app.get('/api/seats', authMiddleware, async (req, res) => {
  const { hall_id } = req.query;
  try {
    const q = hall_id
      ? 'SELECT * FROM seats WHERE hall_id = $1 ORDER BY seat_label ASC'
      : 'SELECT * FROM seats ORDER BY seat_label ASC';
    const { rows } = await pool.query(q, hall_id ? [hall_id] : []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/seats/bulk', authMiddleware, adminOnly, async (req, res) => {
  const { seats } = req.body; // array of seat objects
  if (!seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ error: 'Koltuk listesi gerekli' });
  }
  try {
    const values = seats.map((_, i) => {
      const base = i * 8;
      return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8})`;
    }).join(',');
    const params = seats.flatMap(s => [
      s.hall_id, s.seat_label, s.row_group || null, s.row_number || null,
      s.seat_number || null, s.table_label || null,
      s.seat_status || 'empty', s.price_multiplier || 1
    ]);
    const { rows } = await pool.query(
      `INSERT INTO seats (hall_id, seat_label, row_group, row_number, seat_number, table_label, seat_status, price_multiplier)
       VALUES ${values} RETURNING *`,
      params
    );
    res.status(201).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/seats/:id', authMiddleware, async (req, res) => {
  const { seat_status, price_multiplier } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE seats SET seat_status = COALESCE($1, seat_status), price_multiplier = COALESCE($2, price_multiplier)
       WHERE id = $3 RETURNING *`,
      [seat_status, price_multiplier, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Koltuk bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/seats', authMiddleware, adminOnly, async (req, res) => {
  const { hall_id } = req.query;
  if (!hall_id) return res.status(400).json({ error: 'hall_id gerekli' });
  try {
    await pool.query('DELETE FROM seats WHERE hall_id = $1', [hall_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EVENTS ──────────────────────────────────────────────────────────────────

app.get('/api/events', authMiddleware, async (req, res) => {
  const { is_active } = req.query;
  try {
    let q = 'SELECT * FROM events';
    const params = [];
    if (is_active !== undefined) {
      q += ' WHERE is_active = $1';
      params.push(is_active === 'true');
    }
    q += ' ORDER BY start_date DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/events/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', authMiddleware, adminOnly, async (req, res) => {
  const { title, slogan, description, poster_url, cover_url, category, start_date, end_date, is_active } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO events (title, slogan, description, poster_url, cover_url, category, start_date, end_date, is_active, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, slogan || null, description || null, poster_url || null, cover_url || null,
        category || null, start_date, end_date || null, is_active !== false, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', authMiddleware, adminOnly, async (req, res) => {
  const { title, slogan, description, poster_url, cover_url, category, start_date, end_date, is_active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE events SET title=$1, slogan=$2, description=$3, poster_url=$4, cover_url=$5,
        category=$6, start_date=$7, end_date=$8, is_active=$9, updated_at=now()
       WHERE id=$10 RETURNING *`,
      [title, slogan || null, description || null, poster_url || null, cover_url || null,
        category || null, start_date, end_date || null, is_active !== false, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

app.get('/api/sessions', authMiddleware, async (req, res) => {
  const { event_id, hall_id, session_date, status } = req.query;
  try {
    let q = `SELECT s.*,
      json_build_object('id', e.id, 'title', e.title) as event,
      json_build_object('id', h.id, 'name', h.name) as hall
     FROM sessions s
     LEFT JOIN events e ON e.id = s.event_id
     LEFT JOIN halls h ON h.id = s.hall_id
     WHERE 1=1`;
    const params = [];
    if (event_id) { params.push(event_id); q += ` AND s.event_id = $${params.length}`; }
    if (hall_id) { params.push(hall_id); q += ` AND s.hall_id = $${params.length}`; }
    if (session_date) { params.push(session_date); q += ` AND s.session_date = $${params.length}`; }
    if (status) { params.push(status); q += ` AND s.status = $${params.length}`; }
    q += ' ORDER BY s.session_date ASC, s.start_time ASC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*,
        row_to_json(e) as event,
        row_to_json(h) as hall
       FROM sessions s
       LEFT JOIN events e ON e.id = s.event_id
       LEFT JOIN halls h ON h.id = s.hall_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Seans bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions', authMiddleware, adminOnly, async (req, res) => {
  const { event_id, hall_id, session_date, start_time, duration_minutes, status, base_price } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO sessions (event_id, hall_id, session_date, start_time, duration_minutes, status, base_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [event_id, hall_id, session_date, start_time, duration_minutes, status || 'active', base_price || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sessions/:id', authMiddleware, adminOnly, async (req, res) => {
  const { event_id, hall_id, session_date, start_time, duration_minutes, status, base_price } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE sessions SET event_id=$1, hall_id=$2, session_date=$3, start_time=$4,
        duration_minutes=$5, status=$6, base_price=$7, updated_at=now()
       WHERE id=$8 RETURNING *`,
      [event_id, hall_id, session_date, start_time, duration_minutes, status, base_price, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Seans bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sessions/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TICKETS ──────────────────────────────────────────────────────────────────

app.get('/api/tickets', authMiddleware, async (req, res) => {
  const { session_id, sold_by, start_date, end_date } = req.query;
  try {
    let q = `SELECT t.*,
      json_build_object(
        'id', s.id, 'session_date', s.session_date, 'start_time', s.start_time,
        'duration_minutes', s.duration_minutes, 'base_price', s.base_price, 'status', s.status,
        'event', json_build_object('id', e.id, 'title', e.title, 'category', e.category, 'poster_url', e.poster_url),
        'hall',  json_build_object('id', h.id, 'name', h.name)
      ) as session,
      row_to_json(se) as seat
     FROM tickets t
     LEFT JOIN sessions s  ON s.id  = t.session_id
     LEFT JOIN events e    ON e.id  = s.event_id
     LEFT JOIN halls h     ON h.id  = s.hall_id
     LEFT JOIN seats se    ON se.id = t.seat_id
     WHERE 1=1`;
    const params = [];
    if (session_id) { params.push(session_id); q += ` AND t.session_id = $${params.length}`; }
    if (sold_by) { params.push(sold_by); q += ` AND t.sold_by = $${params.length}`; }
    if (start_date) { params.push(start_date); q += ` AND t.created_at >= $${params.length}`; }
    if (end_date) { params.push(end_date + ' 23:59:59'); q += ` AND t.created_at <= $${params.length}`; }
    q += ' ORDER BY t.created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/by-qr/:qrCode', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*,
        json_build_object(
          'id', s.id, 'session_date', s.session_date, 'start_time', s.start_time,
          'event', json_build_object('id', e.id, 'title', e.title),
          'hall', json_build_object('id', h.id, 'name', h.name)
        ) as session,
        row_to_json(se) as seat
       FROM tickets t
       LEFT JOIN sessions s ON s.id = t.session_id
       LEFT JOIN events e ON e.id = s.event_id
       LEFT JOIN halls h ON h.id = s.hall_id
       LEFT JOIN seats se ON se.id = t.seat_id
       WHERE t.qr_code_data = $1`,
      [req.params.qrCode]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Bilet bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/by-code/:ticketCode', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*,
        json_build_object(
          'id', s.id, 'session_date', s.session_date, 'start_time', s.start_time,
          'event', json_build_object('id', e.id, 'title', e.title),
          'hall', json_build_object('id', h.id, 'name', h.name)
        ) as session,
        row_to_json(se) as seat
       FROM tickets t
       LEFT JOIN sessions s ON s.id = t.session_id
       LEFT JOIN events e ON e.id = s.event_id
       LEFT JOIN halls h ON h.id = s.hall_id
       LEFT JOIN seats se ON se.id = t.seat_id
       WHERE t.ticket_code = $1`,
      [req.params.ticketCode.toUpperCase()]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Bilet bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets/bulk', authMiddleware, async (req, res) => {
  const { tickets } = req.body;
  if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
    return res.status(400).json({ error: 'Bilet listesi gerekli' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const created = [];
    for (const t of tickets) {
      const { rows } = await client.query(
        `INSERT INTO tickets (session_id, seat_id, customer_name, customer_email, customer_phone,
          ticket_code, qr_code_data, status, price, kdv_amount, commission_amount, total_amount,
          payment_method, payment_status, sold_by, is_single_use)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
        [t.session_id, t.seat_id || null, t.customer_name, t.customer_email || null,
          t.customer_phone || null, t.ticket_code, t.qr_code_data, t.status || 'active',
          t.price, t.kdv_amount || 0, t.commission_amount || 0, t.total_amount,
          t.payment_method, t.payment_status || 'successful', t.sold_by || null, t.is_single_use !== false]
      );
      created.push(rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json(created);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/tickets/:id', authMiddleware, async (req, res) => {
  const { status, used_at, payment_status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tickets SET
        status = COALESCE($1, status),
        used_at = COALESCE($2, used_at),
        payment_status = COALESCE($3, payment_status),
        updated_at = now()
       WHERE id = $4 RETURNING *`,
      [status, used_at, payment_status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Bilet bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PRICING SETTINGS ─────────────────────────────────────────────────────────

app.get('/api/pricing-settings', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM pricing_settings WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pricing-settings', authMiddleware, adminOnly, async (req, res) => {
  const { kdv_rate, commission_rate } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE pricing_settings SET is_active = false WHERE is_active = true');
    const { rows } = await client.query(
      'INSERT INTO pricing_settings (kdv_rate, commission_rate, is_active) VALUES ($1,$2,true) RETURNING *',
      [kdv_rate, commission_rate]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── PRICING CATEGORIES ───────────────────────────────────────────────────────

app.get('/api/pricing-categories', authMiddleware, async (req, res) => {
  const { session_id } = req.query;
  try {
    const q = session_id
      ? 'SELECT * FROM pricing_categories WHERE session_id = $1 ORDER BY created_at ASC'
      : 'SELECT * FROM pricing_categories ORDER BY created_at ASC';
    const { rows } = await pool.query(q, session_id ? [session_id] : []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pricing-categories', authMiddleware, adminOnly, async (req, res) => {
  const { session_id, category_name, seat_status_filter, price } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO pricing_categories (session_id, category_name, seat_status_filter, price) VALUES ($1,$2,$3,$4) RETURNING *',
      [session_id, category_name, seat_status_filter || 'empty', price]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pricing-categories/:id', authMiddleware, adminOnly, async (req, res) => {
  const { category_name, seat_status_filter, price } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE pricing_categories SET category_name=$1, seat_status_filter=$2, price=$3 WHERE id=$4 RETURNING *',
      [category_name, seat_status_filter, price, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pricing-categories/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM pricing_categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── QR SCAN LOGS ─────────────────────────────────────────────────────────────

app.get('/api/qr-scan-logs', authMiddleware, async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const isAdmin = req.user.role === 'super_admin';
  try {
    // Admin tüm kayıtları görür; operatör sadece kendi taramalarını görür
    const { rows } = await pool.query(
      `SELECT l.*, row_to_json(t) as ticket
       FROM qr_scan_logs l
       LEFT JOIN tickets t ON t.id = l.ticket_id
       WHERE ($1 OR l.scanned_by = $2)
       ORDER BY l.created_at DESC LIMIT $3`,
      [isAdmin, req.user.id, limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/qr-scan-logs', authMiddleware, async (req, res) => {
  const { ticket_id, scan_result, is_duplicate } = req.body;
  if (!ticket_id) return res.status(400).json({ error: 'ticket_id gerekli' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO qr_scan_logs (ticket_id, scanned_by, scan_result, is_duplicate) VALUES ($1,$2,$3,$4) RETURNING *',
      [ticket_id, req.user.id, scan_result, is_duplicate || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NOTIFICATION SETTINGS ────────────────────────────────────────────────────

app.get('/api/notification-settings', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notification_settings LIMIT 1');
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notification-settings', authMiddleware, superAdminOnly, async (req, res) => {
  const { email_enabled, sms_enabled, email_from, sms_api_key, sms_sender_name,
    send_ticket_info, send_reminder, send_cancellation_notice, reminder_hours_before } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM notification_settings LIMIT 1');
    let rows;
    if (existing.rows.length === 0) {
      ({ rows } = await pool.query(
        `INSERT INTO notification_settings (email_enabled, sms_enabled, email_from, sms_api_key, sms_sender_name,
          send_ticket_info, send_reminder, send_cancellation_notice, reminder_hours_before)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [email_enabled, sms_enabled, email_from, sms_api_key, sms_sender_name,
          send_ticket_info, send_reminder, send_cancellation_notice, reminder_hours_before || 24]
      ));
    } else {
      ({ rows } = await pool.query(
        `UPDATE notification_settings SET email_enabled=$1, sms_enabled=$2, email_from=$3, sms_api_key=$4,
          sms_sender_name=$5, send_ticket_info=$6, send_reminder=$7, send_cancellation_notice=$8,
          reminder_hours_before=$9, updated_at=now() WHERE id=$10 RETURNING *`,
        [email_enabled, sms_enabled, email_from, sms_api_key, sms_sender_name,
          send_ticket_info, send_reminder, send_cancellation_notice, reminder_hours_before || 24,
          existing.rows[0].id]
      ));
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TICKET DESIGN ────────────────────────────────────────────────────────────

app.get('/api/ticket-design', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ticket_design LIMIT 1');
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/ticket-design', authMiddleware, superAdminOnly, async (req, res) => {
  const { logo_url, primary_color, secondary_color, font_family } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM ticket_design LIMIT 1');
    let rows;
    if (existing.rows.length === 0) {
      ({ rows } = await pool.query(
        'INSERT INTO ticket_design (logo_url, primary_color, secondary_color, font_family) VALUES ($1,$2,$3,$4) RETURNING *',
        [logo_url, primary_color, secondary_color, font_family]
      ));
    } else {
      ({ rows } = await pool.query(
        `UPDATE ticket_design SET logo_url=$1, primary_color=$2, secondary_color=$3, font_family=$4, updated_at=now()
         WHERE id=$5 RETURNING *`,
        [logo_url, primary_color, secondary_color, font_family, existing.rows[0].id]
      ));
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────

app.get('/api/activity-logs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/activity-logs', authMiddleware, async (req, res) => {
  const { action, entity_type, entity_id, details } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, action, entity_type, entity_id || null, details || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// ─── SMS SETTINGS ─────────────────────────────────────────────────────────────

app.get('/api/sms-settings', authMiddleware, superAdminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, active_provider,
        im_sender, im_api_key,
        twilio_account_sid, twilio_from,
        created_at
       FROM sms_settings LIMIT 1`
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sms-settings', authMiddleware, superAdminOnly, async (req, res) => {
  const {
    active_provider = 'iletimerkezi',
    im_sender, im_api_key, im_hash_key,
    twilio_account_sid, twilio_auth_token, twilio_from,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM sms_settings LIMIT 1');
    let rows;
    if (existing.rows.length === 0) {
      ({ rows } = await pool.query(
        `INSERT INTO sms_settings
          (active_provider, im_sender, im_api_key, im_hash_key, twilio_account_sid, twilio_auth_token, twilio_from)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, active_provider, im_sender, im_api_key, twilio_account_sid, twilio_from, created_at`,
        [active_provider, im_sender||null, im_api_key||null, im_hash_key||null,
         twilio_account_sid||null, twilio_auth_token||null, twilio_from||null]
      ));
    } else {
      // Hash/token alanlarını sadece dolu gelirse güncelle
      const updateParts = [
        `active_provider=$1`,
        `im_sender=$2`,
        `im_api_key=$3`,
        `twilio_account_sid=$5`,
        `twilio_from=$6`,
        `updated_at=now()`,
      ];
      const params = [
        active_provider, im_sender||null, im_api_key||null,
        existing.rows[0].id,
        twilio_account_sid||null, twilio_from||null,
      ];
      if (im_hash_key && im_hash_key.trim()) {
        updateParts.push(`im_hash_key=$${params.length + 1}`);
        params.push(im_hash_key);
      }
      if (twilio_auth_token && twilio_auth_token.trim()) {
        updateParts.push(`twilio_auth_token=$${params.length + 1}`);
        params.push(twilio_auth_token);
      }
      ({ rows } = await pool.query(
        `UPDATE sms_settings SET ${updateParts.join(',')} WHERE id=$4
         RETURNING id, active_provider, im_sender, im_api_key, twilio_account_sid, twilio_from, created_at`,
        params
      ));
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUBLIC TICKET (auth gerektirmez — dijital bilet linki için) ───────────────

app.get('/api/public/tickets/:ticketCode', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.ticket_code, t.customer_name, t.customer_phone, t.customer_email,
        t.status, t.total_amount, t.qr_code_data, t.created_at,
        json_build_object(
          'id', s.id, 'session_date', s.session_date, 'start_time', s.start_time,
          'event', json_build_object('id', e.id, 'title', e.title, 'category', e.category),
          'hall', json_build_object('id', h.id, 'name', h.name)
        ) as session,
        row_to_json(se) as seat
       FROM tickets t
       LEFT JOIN sessions s ON s.id = t.session_id
       LEFT JOIN events e ON e.id = s.event_id
       LEFT JOIN halls h ON h.id = s.hall_id
       LEFT JOIN seats se ON se.id = t.seat_id
       WHERE t.ticket_code = $1`,
      [req.params.ticketCode.toUpperCase()]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Bilet bulunamadı' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SMS GÖNDER ───────────────────────────────────────────────────────────────

// Türk telefon numarasını E.164 formatına çevirir
function toE164TR(phone) {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('90') && d.length === 12) return '+' + d;   // 905xxxxxxxxx
  if (d.startsWith('0')  && d.length === 11) return '+9' + d;  // 05xxxxxxxxx
  if (d.length === 10)                        return '+90' + d; // 5xxxxxxxxx
  return '+' + d;
}

app.post('/api/sms/send', authMiddleware, adminOnly, async (req, res) => {
  const { ticket_id } = req.body;
  if (!ticket_id) return res.status(400).json({ error: 'ticket_id gerekli' });

  try {
    const [ticketRes, smsRes] = await Promise.all([
      pool.query(
        `SELECT t.ticket_code, t.customer_name, t.customer_phone,
          json_build_object('title', e.title) as event
         FROM tickets t
         LEFT JOIN sessions s ON s.id = t.session_id
         LEFT JOIN events e ON e.id = s.event_id
         WHERE t.id = $1`,
        [ticket_id]
      ),
      pool.query(`SELECT active_provider,
        im_sender, im_api_key, im_hash_key,
        twilio_account_sid, twilio_auth_token, twilio_from
       FROM sms_settings LIMIT 1`),
    ]);

    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Bilet bulunamadı' });
    if (smsRes.rows.length === 0)    return res.status(400).json({ error: 'SMS API ayarları yapılandırılmamış. Ayarlar > SMS API menüsünden ekleyin.' });

    const ticket   = ticketRes.rows[0];
    const settings = smsRes.rows[0];

    if (!ticket.customer_phone) {
      return res.status(400).json({ error: 'Müşterinin kayıtlı telefon numarası yok' });
    }

    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    if (!frontendUrl) {
      return res.status(500).json({ error: 'Sunucu yapılandırma hatası: FRONTEND_URL ortam değişkeni ayarlanmamış. Coolify ortam değişkenlerine FRONTEND_URL ekleyin (örn: https://bilet.siteniz.com)' });
    }
    const ticketUrl      = `${frontendUrl}/bilet/${ticket.ticket_code}`;
    const ticketUrlShort = ticketUrl.replace(/^https?:\/\//, '');
    const customerNameUpper = (ticket.customer_name || '').toUpperCase().trim();

    const smsText = `Sayın ${customerNameUpper}, Bilet linkiniz: ${ticketUrlShort}`;
    const provider    = settings.active_provider || 'iletimerkezi';

    // ── İleti Merkezi ─────────────────────────────────────────────────────────
    if (provider === 'iletimerkezi') {
      if (!settings.im_api_key || !settings.im_hash_key) {
        return res.status(400).json({ error: 'İleti Merkezi API bilgileri eksik' });
      }
      const { IletiMerkeziClient } = await import('@iletimerkezi/iletimerkezi-node');
      const senderVal = settings.im_sender?.trim();
      const senderArg = (!senderVal || senderVal === '-') ? undefined : senderVal;
      const client   = new IletiMerkeziClient(settings.im_api_key, settings.im_hash_key, senderArg);
      const phone    = ticket.customer_phone.replace(/\D/g, '');
      const response = await client.sms().send(phone, smsText);
      if (response.ok()) {
        return res.json({ success: true, message: 'SMS başarıyla gönderildi (İleti Merkezi)', orderId: response.getOrderId() });
      } else {
        return res.status(400).json({ success: false, error: response.getMessage() });
      }
    }

    // ── Twilio ────────────────────────────────────────────────────────────────
    if (provider === 'twilio') {
      if (!settings.twilio_account_sid || !settings.twilio_auth_token || !settings.twilio_from) {
        return res.status(400).json({ error: 'Twilio API bilgileri eksik (Account SID, Auth Token veya From numarası)' });
      }
      const twilio = require('twilio');
      const client = twilio(settings.twilio_account_sid, settings.twilio_auth_token);
      const to     = toE164TR(ticket.customer_phone);
      const msg    = await client.messages.create({ body: smsText, from: settings.twilio_from, to });
      return res.json({ success: true, message: 'SMS başarıyla gönderildi (Twilio)', sid: msg.sid });
    }

    res.status(400).json({ error: `Bilinmeyen sağlayıcı: ${provider}` });
  } catch (err) {
    console.error('SMS send error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── STARTUP: tablolar ────────────────────────────────────────────────────────

(async () => {
  try {
    // Yeni şema ile oluştur (fresh install)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_settings (
        id                  SERIAL PRIMARY KEY,
        active_provider     VARCHAR(20)  NOT NULL DEFAULT 'iletimerkezi',
        im_sender           VARCHAR(20),
        im_api_key          VARCHAR(255),
        im_hash_key         VARCHAR(255),
        twilio_account_sid  VARCHAR(255),
        twilio_auth_token   VARCHAR(255),
        twilio_from         VARCHAR(30),
        created_at          TIMESTAMPTZ  DEFAULT NOW(),
        updated_at          TIMESTAMPTZ  DEFAULT NOW()
      )
    `);
    // Eski kurulumlar için migrate (ADD COLUMN IF NOT EXISTS idempotent)
    const migrations = [
      `ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS active_provider VARCHAR(20) NOT NULL DEFAULT 'iletimerkezi'`,
      `ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS im_sender VARCHAR(20)`,
      `ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS im_api_key VARCHAR(255)`,
      `ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS im_hash_key VARCHAR(255)`,
      `ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS twilio_account_sid VARCHAR(255)`,
      `ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS twilio_auth_token VARCHAR(255)`,
      `ALTER TABLE sms_settings ADD COLUMN IF NOT EXISTS twilio_from VARCHAR(30)`,
      // Eski sütunlardan veri taşı
      `UPDATE sms_settings SET im_sender=sender, im_api_key=api_key, im_hash_key=hash_key WHERE im_api_key IS NULL AND api_key IS NOT NULL`,
    ];
    for (const sql of migrations) {
      await pool.query(sql).catch(() => {});
    }
  } catch (err) {
    console.error('sms_settings tablo hatası:', err.message);
  }
})();

app.listen(PORT, () => {
  console.log(`Biletal API sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
