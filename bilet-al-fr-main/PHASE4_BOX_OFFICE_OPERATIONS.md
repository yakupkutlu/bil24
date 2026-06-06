# Phase 4 — Box Office Operations Upgrade

This phase turns the staff side of Tiatru into a more production-like box-office console.

## Improved pages

- `/box-office/dashboard`
  - Live shift hero
  - Staff operation cards
  - Today show run cards
  - Gate timeline
  - Quick action panel

- `/box-office/sell-ticket`
  - Manual sale stepper
  - Event/showtime selector
  - Interactive seat map
  - Customer information form
  - Cash/card/complimentary payment mode cards
  - Receipt preview
  - Generate and print ticket action

- `/box-office/verify`
  - QR scanner area
  - Manual token input
  - Backend QR tokens for VALID, USED, REFUNDED and NOT_FOUND states
  - Verification result card
  - Mark-as-entered state simulation
  - Recent scan log
  - Double-scan prevention UI

- `/box-office/reservations`
  - Reservation search and filtering
  - Staff reservation cards
  - Confirm payment, extend hold and cancel actions
  - Local state simulation for status changes

- `/box-office/today`
  - Today show operations board
  - Hall readiness checklist
  - Staff announcements
  - Gate and expected audience cards

## New components

```txt
src/components/box-office/StaffShiftHero.tsx
src/components/box-office/LiveShowRunCard.tsx
src/components/box-office/ManualSaleStepper.tsx
src/components/box-office/PaymentReceiptPreview.tsx
src/components/box-office/VerificationResultCard.tsx
src/components/box-office/StaffReservationCard.tsx
```

## New service file

```txt
src/services/boxOffice.service.ts
```

This service wraps the production endpoints used by box-office flows:

```txt
POST /api/bookings
POST /api/payments/checkout
POST /api/tickets/verify
POST /api/tickets/:id/mark-used
PATCH /api/bookings/:id/cancel
```

## Backend scanner tokens

```txt
REAL_QR_TOKEN_FROM_BACKEND
REAL_USED_QR_TOKEN_FROM_BACKEND
REAL_REFUNDED_QR_TOKEN_FROM_BACKEND
QR-NOT-FOUND
```

## Production notes

The UI is ready for backend connection, but real production use still needs:

- Camera QR scanner integration using browser camera APIs or a scanning library.
- Receipt/PDF printing integration.
- Cash drawer/POS integration if needed.
- Real-time ticket status refresh via sockets or polling.
- Staff audit logs for manual sale, cancellation and mark-used operations.
