# Phase 2 — Production Buying Journey Upgrade

This upgrade focuses on the emotional and production-like ticket buying flow:

```txt
Event Details → Seat Selection → Checkout → Payment Success → QR Ticket
```

## What Changed

### 1. Booking flow state

Added:

```txt
src/stores/booking.store.ts
```

The store keeps the buying journey together:

- selected event
- selected showtime
- selected seats
- seat hold expiry time
- customer information
- payment method
- price summary
- generated booking number

This makes the flow cleaner and easier to connect to the real backend later.

### 2. Seat selection experience

Updated:

```txt
src/pages/public/SeatSelectionPage.tsx
src/components/seats/SeatMapViewer.tsx
```

Added:

- richer stage and spotlight visual feeling
- improved seat map header
- seat counters
- hover tooltip with category, status and price
- selected-seat glow animation
- held-seat pulse animation
- mobile sticky summary
- countdown timer for seat hold
- stronger trust messages before checkout

### 3. Checkout experience

Updated:

```txt
src/pages/public/CheckoutPage.tsx
src/components/checkout/CheckoutSummary.tsx
```

Added:

- 4-step checkout progress
- real booking countdown inside checkout
- customer information connected to Zustand store
- discount code support using test code `TIATRU10`
- animated payment method cards
- secure payment messaging
- ticket preview card
- richer price summary

### 4. Ticket success experience

Updated:

```txt
src/pages/public/PaymentSuccessPage.tsx
src/components/tickets/TicketCard.tsx
src/components/tickets/QRCodeCard.tsx
```

Added:

- confetti burst animation
- animated success reveal
- generated tickets from selected seats
- improved QR visual card
- premium ticket card design
- booking number and ticket count summary

## Backend Flow to Test

1. Open `/events`.
2. Open any event details page.
3. Choose a showtime.
4. Select seats on `/showtimes/:showtimeId/seats`.
5. Continue to `/checkout`.
6. Try discount code:

```txt
TIATRU10
```

7. Choose a payment method.
8. Click payment success.
9. Review generated QR tickets.

## Backend Integration Notes

The frontend still uses local preview data for visual flow. When backend is connected, replace local preview calls with these endpoints:

```txt
GET  /api/showtimes/:id/seats
POST /api/showtimes/:id/hold-seats
POST /api/bookings
POST /api/payments/checkout
GET  /api/tickets/my
GET  /api/tickets/:id/download
```

The store can remain useful after backend integration. Backend responses should update the same store fields.
