# Tiatru Backend API Contract

Base URL: `http://localhost:5000/api`

All protected endpoints require:

```http
Authorization: Bearer ACCESS_TOKEN
```

All JSON responses follow:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {}
}
```

## Auth

### POST `/auth/register`

```json
{
  "fullName": "Customer User",
  "email": "customer@example.com",
  "phone": "+905551112233",
  "password": "Password123",
  "preferences": { "language": "tr", "marketingPermission": true }
}
```

### POST `/auth/login`

```json
{ "email": "customer@tiatru.com", "password": "Password123" }
```

### POST `/auth/logout`

No body.

### POST `/auth/refresh`

No body. Uses HttpOnly refresh cookie.

### POST `/auth/forgot-password`

```json
{ "email": "customer@tiatru.com" }
```

### POST `/auth/reset-password`

```json
{ "token": "RESET_TOKEN", "password": "NewPassword123" }
```

### POST `/auth/verify-email`

```json
{ "token": "VERIFY_TOKEN" }
```

## Profile

### GET `/profile`
No body.

### PUT `/profile`

```json
{ "fullName": "New Name", "phone": "+905551112233", "birthDate": "2000-01-01" }
```

### PUT `/profile/password`

```json
{ "currentPassword": "Password123", "newPassword": "NewPassword123" }
```

### PUT `/profile/preferences`

```json
{
  "language": "tr",
  "favoriteCategories": ["Drama", "Comedy"],
  "emailNotifications": true,
  "smsNotifications": false,
  "marketingPermission": true
}
```

## Users Admin

- `GET /users?page=1&limit=20&search=&role=&status=`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`
- `PATCH /users/:id/status`
- `PATCH /users/:id/role`

Bodies:

```json
{ "status": "ACTIVE" }
```

```json
{ "role": "BOX_OFFICE" }
```

## Events

- `GET /events`
- `GET /events/:slug`
- `POST /events`
- `PUT /events/:id`
- `DELETE /events/:id`
- `PATCH /events/:id/status`

Create/update body:

```json
{
  "title": "Bir Yaz Gecesi Rüyası",
  "description": "Full event description here",
  "shortDescription": "Short card text",
  "posterImage": "https://example.com/poster.jpg",
  "gallery": [],
  "trailerUrl": "",
  "category": "Drama",
  "language": "tr",
  "durationMinutes": 120,
  "ageLimit": 12,
  "cast": [{ "name": "Actor Name", "role": "Hamlet", "image": "" }],
  "director": "Director Name",
  "status": "PUBLISHED",
  "seo": { "title": "SEO title", "description": "SEO desc", "keywords": ["theater"] }
}
```

Status body:

```json
{ "status": "PUBLISHED" }
```

## Halls

- `GET /halls`
- `GET /halls/:id`
- `POST /halls`
- `PUT /halls/:id`
- `DELETE /halls/:id`
- `POST /halls/:id/generate-seats`
- `PUT /halls/:id/seats`

Create body:

```json
{
  "name": "Ana Sahne",
  "description": "Main hall",
  "capacity": 96,
  "rows": 8,
  "seatsPerRow": 12,
  "status": "ACTIVE"
}
```

Generate seats body:

```json
{ "rows": 8, "seatsPerRow": 12, "defaultCategory": "STANDARD" }
```

Update seat map body:

```json
{
  "seatMap": [
    { "row": "A", "number": 1, "code": "A1", "category": "VIP", "isAccessible": false, "isBlocked": false, "position": { "x": 1, "y": 1 } }
  ]
}
```

## Showtimes

- `GET /showtimes`
- `GET /showtimes/:id`
- `GET /events/:eventId/showtimes`
- `POST /showtimes`
- `PUT /showtimes/:id`
- `DELETE /showtimes/:id`
- `PATCH /showtimes/:id/status`

Create/update body:

```json
{
  "event": "EVENT_ID",
  "hall": "HALL_ID",
  "date": "2026-07-01T20:00:00.000Z",
  "startTime": "20:00",
  "endTime": "22:00",
  "status": "ON_SALE",
  "pricing": { "VIP": 500, "STANDARD": 320, "STUDENT": 220 },
  "availableFrom": "2026-06-01T00:00:00.000Z",
  "availableUntil": "2026-07-01T18:00:00.000Z",
  "cancellationPolicy": "Refund allowed 24 hours before showtime."
}
```

## Seat Availability

### GET `/showtimes/:id/seats`

Response seat item:

```json
{ "code": "A1", "category": "VIP", "price": 500, "status": "AVAILABLE" }
```

### POST `/showtimes/:id/hold-seats`

```json
{ "seatCodes": ["A1", "A2"], "sessionId": "browser-session-id" }
```

### POST `/showtimes/:id/release-seats`

```json
{ "seatCodes": ["A1", "A2"], "sessionId": "browser-session-id" }
```

## Bookings

- `POST /bookings`
- `GET /bookings/my`
- `GET /bookings`
- `GET /bookings/:id`
- `PATCH /bookings/:id/cancel`
- `PATCH /bookings/:id/expire`

Create body:

```json
{
  "showtime": "SHOWTIME_ID",
  "seatCodes": ["A1", "A2"],
  "sessionId": "browser-session-id",
  "source": "ONLINE",
  "discount": 0
}
```

Box office body:

```json
{
  "showtime": "SHOWTIME_ID",
  "seatCodes": ["B1"],
  "source": "BOX_OFFICE",
  "customer": { "fullName": "Walk-in Customer", "email": "customer@tiatru.com", "phone": "+90555" }
}
```

Cancel body:

```json
{ "reason": "Customer cancelled" }
```

## Payments

- `POST /payments/checkout`
- `POST /payments/iyzico/callback`
- `GET /payments/:id`
- `GET /payments`

Checkout body:

```json
{
  "bookingId": "BOOKING_ID",
  "provider": "MOCK",
  "method": "CARD",
  "success": true
}
```

Cash body:

```json
{ "bookingId": "BOOKING_ID", "provider": "CASH", "method": "CASH" }
```

## Tickets

- `GET /tickets/my`
- `GET /tickets`
- `GET /tickets/:id`
- `GET /tickets/:id/download`
- `POST /tickets/verify`
- `POST /tickets/:id/mark-used`
- `POST /tickets/:id/resend-email`
- `GET /verify-ticket/:qrToken`

Verify body:

```json
{ "qrToken": "QR_TOKEN", "markUsed": false }
```

Mark on scan body:

```json
{ "qrToken": "QR_TOKEN", "markUsed": true }
```

## Refunds

- `POST /refunds`
- `GET /refunds`
- `GET /refunds/:id`
- `PATCH /refunds/:id/approve`
- `PATCH /refunds/:id/reject`
- `PATCH /refunds/:id/process`

Create body:

```json
{ "bookingId": "BOOKING_ID", "reason": "Cannot attend the show", "amount": 500 }
```

Reject body:

```json
{ "reason": "Outside refund policy" }
```

## Reports

- `GET /reports/dashboard`
- `GET /reports/sales`
- `GET /reports/events`
- `GET /reports/occupancy`
- `GET /reports/users`
- `GET /reports/export?format=json`

## Notifications

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `POST /notifications/campaign`

Campaign body:

```json
{
  "role": "CUSTOMER",
  "type": "SYSTEM",
  "title": "New season started",
  "message": "Buy your tickets now."
}
```

## Settings

- `GET /settings`
- `PUT /settings`

Body:

```json
{
  "websiteName": "Tiatru",
  "ticketRules": { "seatHoldMinutes": 10, "cancellationDeadlineHours": 24, "refundAllowed": true, "serviceFee": 15, "taxRate": 0.2 },
  "maintenanceMode": false
}
```

## Audit Logs

- `GET /audit-logs`
- `GET /audit-logs/:id`

## Media

- `POST /media` multipart/form-data field `file`
- `GET /media`
- `DELETE /media/:id`

---

# Backend Integration Patch 1 Additions

## Health

```http
GET /api/health
```

## Box Office One-Step Sale

```http
POST /api/box-office/sell-ticket
```

Body:

```json
{
  "showtimeId": "665...",
  "seatCodes": ["A1", "A2"],
  "customerInfo": {
    "fullName": "Walk-in Customer",
    "email": "walkin@example.com",
    "phone": "+905551112233"
  },
  "paymentType": "CASH"
}
```

Response:

```json
{
  "success": true,
  "message": "Box-office ticket sold",
  "data": {
    "booking": {},
    "payment": {},
    "tickets": [],
    "item": {}
  }
}
```

## Booking Create Compatibility

`POST /api/bookings` accepts both `showtime` and `showtimeId`, and both `customer` and `customerInfo`.

## Ticket List Compatibility

```http
GET /api/tickets?bookingId=<bookingId>
```

Customers receive only their own tickets. Staff can query all tickets.

## Hall Seat Update Compatibility

```http
PUT /api/halls/:id/seats
```

Accepts either:

```json
{ "seatMap": [] }
```

or:

```json
{ "seats": [] }
```

## Universal Response Aliases

List endpoints should now include both `items` and the domain key, for example:

```json
{ "data": { "items": [], "events": [] } }
```

Single-object endpoints should now include both `item` and the domain key, for example:

```json
{ "data": { "item": {}, "event": {} } }
```

---

## Patch 3 Additions

### Payment status

```http
GET /api/payments/:id/status
Authorization: Bearer <token>
```

Returns payment, booking, tickets, and frontend redirect URLs.

### Generic payment callback

```http
POST /api/payments/callback
GET /api/payments/callback
POST /api/payments/iyzico/callback
GET /api/payments/iyzico/callback
```

Accepts provider callback fields such as `paymentId`, `bookingId`, `status`, `paymentStatus`, `providerTransactionId`, `token`, and `conversationId`.

### Event poster upload

```http
POST /api/media/events/:eventId/poster
Authorization: Bearer <staff/admin token>
Content-Type: multipart/form-data

file=<image>
```

### Event gallery upload

```http
POST /api/media/events/:eventId/gallery
Authorization: Bearer <staff/admin token>
Content-Type: multipart/form-data

files=<image[]> or file=<image[]>
```

### Ticket PDF and resend email

```http
GET /api/tickets/:id/download
POST /api/tickets/:id/resend-email
```

`resend-email` supports SMTP when configured and log-only mode when SMTP is missing.
