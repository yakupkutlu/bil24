# Biletal — Bilet Yönetim Sistemi

Tiyatro, konser, sinema ve spor etkinlikleri için salon tabanlı bilet satış ve QR doğrulama uygulaması.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Stil | Tailwind CSS |
| Backend | Express.js (Node.js) |
| Veritabanı | PostgreSQL 16 (Docker) |
| Kimlik Doğrulama | JWT + bcryptjs |
| QR Okuma | html5-qrcode |

---

## Gereksinimler

- [Node.js](https://nodejs.org/) v18 veya üstü
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- npm v9 veya üstü

---

## 1. Veritabanı Kurulumu (Docker)

### PostgreSQL Container Başlatma

```bash
docker run -d \
  --name biletal-postgres \
  -e POSTGRES_USER=bilet_user \
  -e POSTGRES_PASSWORD=Bilet!guclu* \
  -e POSTGRES_DB=bilet_db \
  -p 5432:5432 \
  postgres:16
```

### Şemayı Uygula

```bash
psql -h localhost -U bilet_user -d bilet_db -f database/schema.sql
```

> **Not:** `psql` aracı yoksa [pgAdmin](https://www.pgadmin.org/) veya DBeaver kullanarak `database/schema.sql` dosyasını çalıştırabilirsiniz.

### Örnek Kullanıcıları Ekle

```bash
psql -h localhost -U bilet_user -d bilet_db -f database/seed.sql
```

---

## 2. Backend Kurulumu

```bash
cd server
npm install
```

### Backend Ortam Değişkenleri (`server/.env`)

```env
PORT=5001
DB_USER=bilet_user
DB_PASSWORD=Bilet!guclu*
DB_HOST=localhost
DB_NAME=bilet_db
DB_PORT=5432
JWT_SECRET=biletal-super-secret-jwt-key-2024-change-in-production
```

> **Üretim ortamında** `JWT_SECRET` değerini uzun ve rastgele bir string ile değiştirin.

### Backend Başlatma

```bash
# Geliştirme (otomatik yeniden başlatma)
npm run dev

# Üretim
npm start
```

API şu adreste çalışır: `http://localhost:5001`

---

## 3. Frontend Kurulumu

Proje kök dizininde:

```bash
npm install
```

### Frontend Ortam Değişkenleri (`.env`)

```env
VITE_API_URL=http://localhost:5001
```

### Frontend Başlatma

```bash
npm run dev
```

Uygulama şu adreste açılır: `http://localhost:3002`

---

## Çalıştırma Özeti

İki ayrı terminal açın:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

| Servis | URL |
|--------|-----|
| Frontend (React) | http://localhost:3002 |
| Backend API | http://localhost:5001 |
| PostgreSQL | localhost:5432 |

---

## Varsayılan Kullanıcılar

> Tüm kullanıcıların şifresi: **`Asd123`**

| Rol | E-posta | Yetki |
|-----|---------|-------|
| **Super Admin** | admin@biletal.com | Tüm yetkiler: kullanıcı yönetimi, salon/etkinlik/seans CRUD, raporlar, ayarlar |
| **Operatör** | operator@biletal.com | Bilet satışı, QR tarama, salon durumu görüntüleme |
| **Müşteri** | musteri@biletal.com | Etkinlik listeleme, kendi biletlerini görüntüleme |

---

## Proje Yapısı

```
biletal/
├── database/
│   ├── schema.sql          # Veritabanı şeması (tabloları oluşturur)
│   └── seed.sql            # Örnek kullanıcı verisi
│
├── server/                 # Express.js Backend
│   ├── index.js            # Ana sunucu + tüm API route'ları
│   ├── package.json
│   └── .env                # Backend ortam değişkenleri
│
├── src/                    # React Frontend
│   ├── components/
│   │   ├── admin/          # Kullanıcı yönetimi, raporlar, bilet tasarımı
│   │   ├── events/         # Etkinlik listesi, detay, form
│   │   ├── halls/          # Salon listesi, form, koltuk haritası
│   │   ├── notifications/  # Bildirim ayarları
│   │   ├── operator/       # QR okuma, salon durumu
│   │   ├── pricing/        # Fiyatlandırma ayarları ve kategoriler
│   │   ├── sessions/       # Seans listesi ve form
│   │   └── tickets/        # Bilet satışı ve kart
│   ├── hooks/
│   │   └── useAuth.tsx     # JWT kimlik doğrulama hook'u
│   ├── lib/
│   │   ├── api.ts          # Backend API istemcisi
│   │   └── utils.ts        # Yardımcı fonksiyonlar
│   └── types/
│       └── index.ts        # TypeScript tipleri
│
├── .env                    # Frontend ortam değişkenleri
├── vite.config.ts
└── package.json
```

---

## API Uç Noktaları

### Kimlik Doğrulama
| Metod | URL | Açıklama |
|-------|-----|----------|
| POST | `/api/auth/login` | Giriş yap, JWT döner |
| POST | `/api/auth/register` | Yeni kullanıcı oluştur |
| GET | `/api/auth/me` | Mevcut kullanıcı bilgisi |

### Kaynaklar (JWT gerektirir)
| Metod | URL | Açıklama |
|-------|-----|----------|
| GET/POST | `/api/halls` | Salon listesi / oluştur |
| GET/PUT/DELETE | `/api/halls/:id` | Salon detay / güncelle / sil |
| GET/POST | `/api/events` | Etkinlik listesi / oluştur |
| GET/PUT/DELETE | `/api/events/:id` | Etkinlik detay / güncelle / sil |
| GET/POST | `/api/sessions` | Seans listesi / oluştur |
| POST | `/api/tickets/bulk` | Toplu bilet oluştur |
| GET | `/api/tickets/by-qr/:code` | QR ile bilet bul |
| GET | `/api/tickets/by-code/:code` | Kod ile bilet bul |
| GET/POST | `/api/pricing-settings` | Fiyatlandırma ayarları |
| GET/PUT | `/api/notification-settings` | Bildirim ayarları |
| GET/PUT | `/api/ticket-design` | Bilet tasarımı |

---

## Docker Komutları

```bash
# Container durumunu kontrol et
docker ps

# Container'ı durdur
docker stop biletal-postgres

# Container'ı yeniden başlat
docker start biletal-postgres

# Veritabanına bağlan
docker exec -it biletal-postgres psql -U bilet_user -d bilet_db

# Logları izle
docker logs -f biletal-postgres
```

---

## Sorun Giderme

**`bcrypt` derleme hatası (Windows):**
Server `bcryptjs` kullanır (pure JavaScript), derleme aracı gerektirmez.

**PostgreSQL bağlantı hatası:**
```bash
# Container çalışıyor mu?
docker ps | grep biletal-postgres
# Çalışmıyorsa başlat
docker start biletal-postgres
```

**Port zaten kullanımda:**
```bash
# Windows — hangi uygulama kullanıyor?
netstat -ano | findstr :5001
netstat -ano | findstr :3002
```
