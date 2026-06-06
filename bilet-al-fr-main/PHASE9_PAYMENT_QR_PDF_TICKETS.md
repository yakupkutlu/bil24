# Phase 9 — Payment, QR, PDF Ticket & Scanner Readiness

Phase 9 upgrades the frontend business flow from visual build toward production ticketing.

## Main goal

Make the core ticketing chain API-ready:

```txt
Checkout payment → provider redirect/return → ticket retrieval → QR verification → PDF download/print → resend ticket email
```

## What changed

### 1. Checkout is provider-ready

Updated file:

```txt
src/pages/public/CheckoutPage.tsx
src/services/payments.service.ts
src/stores/booking.store.ts
```

The checkout flow now sends richer payment data:

```txt
POST /api/bookings
POST /api/payments/checkout
```

Payload includes:

```txt
bookingId
provider: MOCK | IYZICO | CASH
method: CARD | CASH
amount
currency
returnUrl
callbackUrl
source
```

If the backend returns one of these fields, the frontend redirects the user to the provider page:

```txt
redirectUrl
paymentUrl
checkoutUrl
```

If there is no redirect URL, the frontend treats the checkout as completed and moves to `/payment/success`.

---

### 2. Payment success retrieves real tickets

Updated file:

```txt
src/pages/public/PaymentSuccessPage.tsx
src/services/tickets.service.ts
```

The success page now reads:

```txt
/payment/success?bookingId=<bookingId>&paymentId=<paymentId>
/payment/callback?bookingId=<bookingId>
```

Then it tries:

```txt
GET /api/tickets?bookingId=<bookingId>
```

Backend response fallback:

```txt
GET /api/tickets/my
```

If backend-only mode is enabled and backend is offline, backend tickets still render.

---

### 3. Ticket PDF download is connected

Updated files:

```txt
src/services/tickets.service.ts
src/components/tickets/TicketActionButtons.tsx
src/components/tickets/TicketCard.tsx
```

Each ticket card now supports:

```txt
GET /api/tickets/:id/download
POST /api/tickets/:id/resend-email
```

Actions:

```txt
Download PDF
Print ticket
Resend email
Copy verification link
```

The success page also supports:

```txt
Download all ticket PDFs
Print all tickets
```

---

### 4. Print-friendly ticket template

New file:

```txt
src/utils/ticketPrint.ts
```

This creates a clean printable ticket template with:

```txt
Event title
Ticket number
Seat
Hall
Date
Price
QR token / QR image
```

It opens a browser print window without requiring extra dependencies.

---

### 5. Real camera QR scanner readiness

Updated file:

```txt
src/components/tickets/QRCodeScanner.tsx
```

The QR scanner now supports:

```txt
Browser camera access
Native BarcodeDetector API when available
Manual token input
Scanner status/error messages
```

No new package dependency was added.

Important note:

```txt
BarcodeDetector is not supported by every browser.
Chrome-based browsers usually work better.
Manual token input always remains available.
```

---

### 6. Public ticket verification uses backend API

Updated file:

```txt
src/pages/public/VerifyTicketPage.tsx
```

The public verification page now calls:

```txt
POST /api/tickets/verify
```

If the logged-in user has staff/admin role, it also allows:

```txt
POST /api/tickets/:id/mark-used
```

Public visitors can only verify validity.

---

## Backend endpoints expected

```txt
POST /api/bookings
POST /api/payments/checkout
GET /api/tickets?bookingId=<bookingId>
GET /api/tickets/my
GET /api/tickets/:id/download
POST /api/tickets/verify
POST /api/tickets/:id/mark-used
POST /api/tickets/:id/resend-email
```

## Payment provider response expected

The frontend accepts any of these payment checkout response shapes:

```js
{
  data: {
    id: "payment_id",
    status: "SUCCESS",
    redirectUrl: "https://provider-checkout-url"
  }
}
```

or:

```js
{
  data: {
    payment: { id: "payment_id", status: "SUCCESS" },
    tickets: [...],
    paymentUrl: "https://provider-checkout-url"
  }
}
```

## How to test

Use strict backend mode:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=false
```

Test flow:

```txt
/events
→ event details
→ choose showtime
→ select seats
→ checkout
→ payment success
→ download PDF
→ print ticket
→ copy verify link
→ /verify-ticket/:qrToken
→ box-office mark-used
```

## Still depends on backend

The frontend is ready, but the backend must actually implement:

```txt
Provider redirect creation
Provider callback validation
Ticket PDF generation
Ticket email resend
QR token verification
Ticket mark-used locking
GET /api/tickets?bookingId=...
```
