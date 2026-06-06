# Phase 3 — Customer Experience Upgrade

Phase 3 focuses on the signed-in customer area after the buying flow. The goal is to make the customer dashboard, tickets, reservations, orders, refunds, and profile pages feel emotional, useful, and production-like.

## Main upgraded routes

```txt
/customer/dashboard
/customer/tickets
/customer/reservations
/customer/orders
/customer/refunds
/customer/profile
```

## New customer components

```txt
src/components/customer/CustomerHero.tsx
src/components/customer/JourneyTimeline.tsx
src/components/customer/ReservationCard.tsx
src/components/customer/OrderExperienceCard.tsx
src/components/customer/RefundFlowCard.tsx
src/components/customer/ProfileCompletionCard.tsx
src/components/customer/LoyaltySpotlightCard.tsx
```

## Dashboard improvements

The customer dashboard now includes:

- emotional customer hero
- next-ticket preview
- customer stats cards
- theater journey timeline
- account activity chart
- recommended events section
- active reservation spotlight
- loyalty/reward spotlight
- ready-for-entry ticket card

## Tickets page improvements

The tickets page now includes:

- cinematic page header
- ready ticket counter
- search input
- animated tab sections
- upcoming / used / cancelled / refunded / expired categories
- empty states per category
- premium QR ticket cards

## Reservations page improvements

The reservations page now includes:

- emotional reservation header
- active hold summary
- reservation cards with poster, seats, timer, and price
- pay-now flow button
- cancel action placeholder
- note about backend seat-lock refresh

## Orders page improvements

The orders page now includes:

- order archive hero
- total orders / paid amount / refunded orders cards
- order search
- premium ticket-shaped order cards
- subtotal / service / tax / total breakdown
- invoice/download/ticket action buttons

## Refunds page improvements

The refunds page now includes:

- refund center hero
- refund request form
- policy confirmation checkbox
- refund status timeline cards
- requested / approved / processing / refunded flow
- backend integration notes for finance/admin approval

## Profile page improvements

The profile page now includes:

- emotional profile hero
- profile completion score
- notification preference cards
- personal details form
- language and favorite categories
- password security card

## Local preview data additions

Customer pages now load customer data from backend endpoints:

```txt
bookings from /api/bookings/my
backend previewReservations
tickets from /api/tickets/my
backend previewPayments
backend previewRefunds
backend previewNotifications
customerActivity chart data
```

## Backend endpoints expected later

These pages are visually complete but still use local preview data. When connecting to the backend, wire them to:

```txt
GET /api/bookings/my
GET /api/tickets/my
GET /api/refunds
POST /api/refunds
GET /api/profile
PUT /api/profile
PUT /api/profile/password
PUT /api/profile/preferences
POST /api/payments/checkout
PATCH /api/bookings/:id/cancel
POST /api/tickets/:id/resend-email
GET /api/tickets/:id/download
```

## Build test

This phase was tested with:

```bash
npm install
npm run build
```

Build passed successfully. Vite may show a normal large bundle warning because the project includes many pages, Framer Motion, and Recharts.
