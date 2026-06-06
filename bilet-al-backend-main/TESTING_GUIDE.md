# Testing Guide

## 1. Start MongoDB

```bash
mongod
```

Or use Docker:

```bash
docker run --name tiatru-mongo -p 27017:27017 -d mongo:7
```

## 2. Install and Configure

```bash
npm install
cp .env.example .env
```

Set secure JWT secrets in `.env`.

## 3. Seed

```bash
npm run seed
```

## 4. Start API

```bash
npm run dev
```

## 5. Test Main Customer Flow

Login:

```http
POST /api/auth/login
{ "email": "customer@tiatru.com", "password": "Password123" }
```

Copy `accessToken`.

List showtimes:

```http
GET /api/showtimes
```

Seat map:

```http
GET /api/showtimes/:id/seats
```

Hold seats:

```http
POST /api/showtimes/:id/hold-seats
Authorization: Bearer TOKEN
{ "seatCodes": ["A1", "A2"], "sessionId": "test-session" }
```

Create booking:

```http
POST /api/bookings
Authorization: Bearer TOKEN
{ "showtime": "SHOWTIME_ID", "seatCodes": ["A1", "A2"], "sessionId": "test-session" }
```

Mock checkout:

```http
POST /api/payments/checkout
Authorization: Bearer TOKEN
{ "bookingId": "BOOKING_ID", "provider": "MOCK", "method": "CARD", "success": true }
```

View tickets:

```http
GET /api/tickets/my
Authorization: Bearer TOKEN
```

## 6. Staff QR Flow

Login as `staff@tiatru.com / Password123`, then:

```http
POST /api/tickets/verify
Authorization: Bearer STAFF_TOKEN
{ "qrToken": "QR_TOKEN", "markUsed": false }
```

Mark as entered:

```http
POST /api/tickets/verify
Authorization: Bearer STAFF_TOKEN
{ "qrToken": "QR_TOKEN", "markUsed": true }
```

A second mark-used call returns conflict/already-used behavior.

## 7. Admin Flow

Login as `superadmin@tiatru.com / Password123` and test:

- `GET /api/users`
- `POST /api/events`
- `POST /api/halls`
- `POST /api/showtimes`
- `GET /api/reports/dashboard`
- `GET /api/audit-logs`

## 8. Known External Placeholders

Mock payment works locally. Real production requires provider setup for Iyzico, SMTP email, SMS, cloud storage, and real-time socket updates.

---

# Frontend Integration Patch 1 Testing

## Required frontend env

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=false
```

## Backend checks

```bash
npm install
npm run check
node --check src/app.js
```

## Health

```http
GET http://localhost:5000/api/health
```

Expected: `success: true`.

## Box-office one-step sale

Login as `BOX_OFFICE`, `ADMIN`, or `SUPER_ADMIN`, then call:

```http
POST /api/box-office/sell-ticket
```

```json
{
  "showtimeId": "<showtimeId>",
  "seatCodes": ["A1"],
  "customerInfo": {
    "fullName": "Walk-in Customer",
    "email": "walkin@example.com",
    "phone": "+905551112233"
  },
  "paymentType": "CASH"
}
```

Expected: `booking`, `payment`, and `tickets` in response.

## Frontend manual sale button

Open:

```txt
/box-office/sell-ticket
```

Click:

```txt
Generate and print ticket
```

Expected:

- booking created
- payment created
- ticket created
- browser print dialog opens

## Ticket by booking

```http
GET /api/tickets?bookingId=<bookingId>
```

Expected: tickets for that booking.
