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

app.use(cors({
  origin: (origin, callback) => {
    // localhost'tan gelen her isteğe izin ver (geliştirme ortamı)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: izin verilmeyen kaynak'));
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

app.listen(PORT, () => {
  console.log(`Biletal API sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
