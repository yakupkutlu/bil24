# Phase 6 — Backend Integration, Real Data, and End-to-End Testing

Phase 6 moves Tiatru from a beautiful frontend build toward a production-ready frontend that can talk to the real backend API.

## What changed

### 1. API-first data layer with backend-only mode

Added:

```txt
src/hooks/useApiResource.ts
src/components/integration/ApiModeBadge.tsx
src/components/integration/ApiFallbackNotice.tsx
src/utils/apiAdapters.ts
```

The frontend now tries the backend first. If the backend is offline and `VITE_ENABLE_DEMO_FALLBACK=true`, the page stays usable with backend data.

### 2. Improved Axios integration

Updated:

```txt
src/services/api.ts
```

Includes:

- `VITE_API_BASE_URL`
- HttpOnly refresh-cookie support through `POST /api/auth/refresh`
- access token injection
- 401 retry flow
- normalized backend errors
- safer response unwrapping for `{ data }`, `{ result }`, or direct responses

### 3. Real authentication attempts

Updated:

```txt
src/pages/auth/LoginPage.tsx
src/pages/auth/RegisterPage.tsx
src/stores/auth.store.ts
```

Login/register now try the backend first:

```txt
POST /api/auth/login
POST /api/auth/register
```

If backend login is unavailable, backend role login is still available for frontend testing.

### 4. Public browsing integration

Updated:

```txt
src/pages/public/EventsPage.tsx
src/pages/public/EventDetailsPage.tsx
```

Connected to:

```txt
GET /api/events
GET /api/events/:slug
GET /api/events/:eventId/showtimes
```

### 5. Seat selection integration

Updated:

```txt
src/pages/public/SeatSelectionPage.tsx
```

Connected to:

```txt
GET /api/showtimes/:id
GET /api/showtimes/:id/seats
POST /api/showtimes/:id/hold-seats
```

Seat availability refreshes every 20 seconds when the backend is available.

### 6. Checkout integration

Updated:

```txt
src/pages/public/CheckoutPage.tsx
src/pages/public/PaymentSuccessPage.tsx
```

Connected to:

```txt
POST /api/bookings
POST /api/payments/checkout
GET /api/tickets/my
```

If checkout endpoints are offline and backend-only mode is enabled, the app still generates a local success preview.

### 7. Customer area integration

Updated:

```txt
src/pages/customer/CustomerDashboardPage.tsx
src/pages/customer/CustomerTicketsPage.tsx
src/pages/customer/CustomerReservationsPage.tsx
src/pages/customer/CustomerOrdersPage.tsx
src/pages/customer/CustomerRefundsPage.tsx
src/pages/customer/CustomerProfilePage.tsx
```

Connected to:

```txt
GET /api/tickets/my
GET /api/bookings/my
GET /api/events
GET /api/refunds
POST /api/refunds
GET /api/profile
PUT /api/profile
PUT /api/profile/preferences
```

### 8. Box-office QR verification integration

Updated:

```txt
src/pages/box-office/BoxOfficeVerifyPage.tsx
```

Connected to:

```txt
POST /api/tickets/verify
POST /api/tickets/:id/mark-used
```

Use real QR tokens returned by the backend:

```txt
REAL_QR_TOKEN_FROM_BACKEND
REAL_USED_QR_TOKEN_FROM_BACKEND
REAL_REFUNDED_QR_TOKEN_FROM_BACKEND
QR-NOT-FOUND
```

### 9. Admin integration start

Updated:

```txt
src/pages/admin/AdminDashboardPage.tsx
src/pages/admin/AdminEventsPage.tsx
```

Connected to:

```txt
GET /api/reports/dashboard
GET /api/events
```

Other admin pages already have service files ready for integration:

```txt
src/services/showtimes.service.ts
src/services/halls.service.ts
src/services/bookings.service.ts
src/services/users.service.ts
src/services/payments.service.ts
src/services/refunds.service.ts
src/services/settings.service.ts
src/services/auditLogs.service.ts
```

## Environment

Use:

```bash
cp .env.example .env
```

`.env`:

```txt
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Tiatru
VITE_ENABLE_DEMO_FALLBACK=true
```

Use backend-only testing:

```txt
VITE_ENABLE_DEMO_FALLBACK=false
```

## End-to-end test flow

### Customer buying flow

```txt
/login
→ Live API login or customer login
→ /events
→ /events/kirmizi-perde
→ choose showtime
→ /showtimes/:showtimeId/seats
→ select seats
→ /checkout
→ complete payment
→ /payment/success
→ /customer/tickets
```

### Box-office gate flow

```txt
/login as BOX_OFFICE
→ /box-office/verify
→ enter a real qrToken returned by backend
→ Verify
→ Mark as entered
→ scan same ticket again
→ status becomes USED
```

### Admin flow

```txt
/login as ADMIN
→ /admin/dashboard
→ /admin/events
→ check Live API / Backend-only mode badge
```

## Backend endpoints expected

```txt
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
GET /api/profile
PUT /api/profile
PUT /api/profile/preferences
GET /api/events
GET /api/events/:slug
GET /api/events/:eventId/showtimes
GET /api/showtimes/:id
GET /api/showtimes/:id/seats
POST /api/showtimes/:id/hold-seats
POST /api/bookings
GET /api/bookings/my
POST /api/payments/checkout
GET /api/tickets/my
POST /api/tickets/verify
POST /api/tickets/:id/mark-used
GET /api/refunds
POST /api/refunds
GET /api/reports/dashboard
```

## Build test

Tested with:

```bash
npm install
npm run build
```

Build passed successfully. Vite may show a normal large-bundle warning because the project includes many pages, Recharts, and Framer Motion.
