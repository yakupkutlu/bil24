# Tiatru Backend

Production-style Express + MongoDB backend for **Tiatru — Modern Tiyatro Bilet Satış Sistemi**.

## Built Features

- Node.js + Express.js REST API
- MongoDB + Mongoose models
- JWT access tokens + refresh-token rotation in HttpOnly cookies
- Role-based authorization for CUSTOMER, BOX_OFFICE, EVENT_MANAGER, FINANCE, ADMIN, SUPER_ADMIN
- Zod validation per module
- Centralized error handling
- Helmet, CORS, rate limiting, Mongo sanitization, HPP protection
- Event, hall, seat-map, showtime, booking, payment, ticket, refund, notification, report, setting, media, and audit-log modules
- Temporary seat holding with MongoDB TTL support
- Mock/CASH payment checkout flow
- QR e-ticket generation and verification
- Seeder with sample users, hall, events, and showtimes

## Install

```bash
cd tiatru-backend
npm install
cp .env.example .env
```

Edit `.env` and set at least:

```env
MONGO_URI=mongodb://127.0.0.1:27017/tiatru
JWT_ACCESS_SECRET=your_long_access_secret
JWT_REFRESH_SECRET=your_long_refresh_secret
CLIENT_URL=http://localhost:5173
```

## Run

```bash
npm run dev
```

Health check:

```bash
GET http://localhost:5000/health
```

## Seed Database

```bash
npm run seed
```

Seed accounts:

| Email | Password | Role |
|---|---|---|
| superadmin@tiatru.com | Password123 | SUPER_ADMIN |
| admin@tiatru.com | Password123 | ADMIN |
| staff@tiatru.com | Password123 | BOX_OFFICE |
| customer@tiatru.com | Password123 | CUSTOMER |

## Main Flow Test

1. `npm run seed`
2. Login as `customer@tiatru.com / Password123`
3. `GET /api/events`
4. `GET /api/showtimes`
5. Copy a showtime id
6. `GET /api/showtimes/:id/seats`
7. `POST /api/showtimes/:id/hold-seats`
8. `POST /api/bookings`
9. `POST /api/payments/checkout` with provider `MOCK`
10. `GET /api/tickets/my`
11. Login as staff/admin and verify QR with `POST /api/tickets/verify`

## Important Production Integrations Still Needed

This backend includes safe placeholders for external services. Before real production launch, connect and test:

- Iyzico payment API credentials and callback signature validation
- Real SMTP/email provider
- Real SMS provider
- Cloud media storage such as S3/Cloudinary
- Optional Redis/Socket.IO live seat-map updates
- Production monitoring and backup jobs


─────────┬─────────────────────────┬───────────────┬───────────────┐
│ (index) │ email                   │ password      │ role          │
├─────────┼─────────────────────────┼───────────────┼───────────────┤
│ 0       │ 'superadmin@tiatru.com' │ 'Password123' │ 'SUPER_ADMIN' │
│ 1       │ 'admin@tiatru.com'      │ 'Password123' │ 'ADMIN'       │
│ 2       │ 'staff@tiatru.com'      │ 'Password123' │ 'BOX_OFFICE'  │
│ 3       │ 'customer@tiatru.com'   │ 'Password123' │ 'CUSTOMER'    │
└─────────┴─────────────────────────┴───────────────┴───────────────┘