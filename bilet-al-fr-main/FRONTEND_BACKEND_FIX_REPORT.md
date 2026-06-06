# Frontend / Backend Fix Report

## Latest frontend phase

Phase 9: Payment, QR, PDF Ticket & Scanner Readiness.

## Important backend compatibility requirements

The frontend now assumes the backend supports these ticketing production endpoints:

```txt
POST /api/bookings
POST /api/payments/checkout
GET /api/tickets?bookingId=<bookingId>
GET /api/tickets/:id/download
POST /api/tickets/:id/resend-email
POST /api/tickets/verify
POST /api/tickets/:id/mark-used
```

## Payment checkout compatibility

The frontend can handle:

```txt
redirectUrl
paymentUrl
checkoutUrl
```

If one of these exists, the user is redirected to the payment provider.

## Ticket compatibility

The frontend normalizes MongoDB `_id` into `id`, and supports QR fields:

```txt
qrToken
token
ticketNumber
id
```

## Known backend work still needed

```txt
Real payment provider credentials and callbacks
Real PDF generation endpoint
Real email/SMS ticket delivery
Real QR scanner/token security rules
Double-entry prevention on ticket mark-used
Seat lock expiration and conflict protection
```
