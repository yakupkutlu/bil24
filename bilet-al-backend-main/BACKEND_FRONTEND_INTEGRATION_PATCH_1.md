# Backend Integration Patch 1 — Frontend Contract Compatibility

This patch aligns the Tiatru backend with the latest frontend production flow.

## Main fixes

### 1. Booking compatibility

`POST /api/bookings` now accepts both backend-native and frontend-native field names:

```json
{
  "showtime": "665..."
}
```

or:

```json
{
  "showtimeId": "665..."
}
```

It also accepts:

```json
{
  "customer": { "fullName": "Walk-in Customer", "email": "customer@example.com", "phone": "+90555" }
}
```

or:

```json
{
  "customerInfo": { "fullName": "Walk-in Customer", "email": "customer@example.com", "phone": "+90555" }
}
```

### 2. Box-office walk-in sales

For `source: "BOX_OFFICE"`, the backend now creates/uses a real customer user instead of saving the booking under the staff user.

If no email is provided, the backend generates a local walk-in email like:

```txt
walkin-<timestamp>-<id>@tiatru.local
```

### 3. New one-call box-office sale endpoint

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

Supported `paymentType` values:

```txt
CASH
CARD
COMPLIMENTARY
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

### 4. Hall seat update compatibility

`PUT /api/halls/:id/seats` accepts both:

```json
{ "seatMap": [] }
```

and:

```json
{ "seats": [] }
```

### 5. Ticket query by booking

`GET /api/tickets?bookingId=<bookingId>` is now supported.

Aliases supported:

```txt
bookingId -> booking
showtimeId -> showtime
```

Customers can now call `GET /api/tickets?bookingId=` and only receive their own tickets. Staff users can query all tickets.

### 6. Payment checkout compatibility

`POST /api/payments/checkout` now accepts:

```json
{
  "bookingId": "665...",
  "paymentType": "CASH",
  "complimentary": false,
  "customerInfo": {}
}
```

For complimentary payments, amount becomes `0` and tickets are generated if checkout succeeds.

The response includes frontend-friendly URLs:

```json
{
  "redirectUrl": "http://localhost:5173/payment/success?bookingId=...&paymentId=...",
  "paymentUrl": "...",
  "checkoutUrl": "...",
  "successUrl": "...",
  "failedUrl": "..."
}
```

### 7. QR verification response compatibility

`POST /api/tickets/verify` now returns:

```json
{
  "state": "VALID",
  "ticket": {},
  "item": {},
  "canEnter": true,
  "alreadyUsed": false
}
```

QR images now encode the frontend verification URL:

```txt
CLIENT_URL/verify-ticket/<qrToken>
```

### 8. Health endpoint compatibility

Both endpoints are now available:

```http
GET /health
GET /api/health
```

### 9. Universal response aliases

Several list endpoints now return both the old named key and a universal `items` key:

```json
{
  "data": {
    "items": [],
    "events": []
  }
}
```

Several single-object endpoints now return both the old named key and a universal `item` key:

```json
{
  "data": {
    "item": {},
    "event": {}
  }
}
```

## Important endpoints for the frontend

```http
GET /api/health
POST /api/bookings
POST /api/payments/checkout
GET /api/tickets?bookingId=<bookingId>
POST /api/box-office/sell-ticket
POST /api/tickets/verify
POST /api/tickets/:id/mark-used
GET /api/tickets/:id/download
POST /api/tickets/:id/resend-email
PUT /api/halls/:id/seats
```

## Still not fully production-real

These are still provider/infrastructure tasks:

- Real Iyzico checkout and signed callback validation
- Real email delivery and ticket templates
- Real SMS delivery
- Real-time seat locking with WebSocket or frequent polling
- Cloud upload provider for posters/gallery
- Advanced PDF ticket design
