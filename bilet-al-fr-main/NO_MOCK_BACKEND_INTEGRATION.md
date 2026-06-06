# No-Mock Backend Integration Update

This version removes the local preview data layer from the frontend and makes the app depend on the backend API.

## Main changes

- Removed `src/constants/mockData.ts`.
- Removed `src/constants/adminMockData.ts`.
- Removed `src/hooks/useMockQuery.ts`.
- Removed demo login behavior from the auth store and login/register pages.
- Disabled local data fallback in `useApiResource`.
- Public, customer, box-office, and admin pages now read from service files that call the backend.
- Empty/error states now show backend-required messages instead of local preview rows.
- The QR scanner starts with an empty token and requires a real backend QR token.
- The public verification link no longer points to a hardcoded token.
- Admin reports, payments, refunds, and audit logs now use live backend services.

## Required environment

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=false
VITE_APP_ENV=development
```

## Backend endpoints required

The frontend now requires these endpoint groups to be available:

```txt
GET /api/health
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
GET /api/profile
GET /api/events
GET /api/events/:slug
GET /api/showtimes
GET /api/events/:eventId/showtimes
GET /api/showtimes/:id/seats
POST /api/showtimes/:id/hold-seats
POST /api/bookings
GET /api/bookings/my
GET /api/bookings
POST /api/payments/checkout
GET /api/payments
GET /api/tickets/my
GET /api/tickets?bookingId=<bookingId>
POST /api/tickets/verify
POST /api/tickets/:id/mark-used
GET /api/tickets/:id/download
POST /api/tickets/:id/resend-email
GET /api/refunds
POST /api/refunds
PATCH /api/refunds/:id/approve
PATCH /api/refunds/:id/reject
PATCH /api/refunds/:id/process
GET /api/users
PATCH /api/users/:id/status
PATCH /api/users/:id/role
GET /api/halls
PUT /api/halls/:id/seats
GET /api/reports/dashboard
GET /api/reports/sales
GET /api/reports/events
GET /api/reports/occupancy
GET /api/reports/users
GET /api/settings
PUT /api/settings
GET /api/audit-logs
```

## How to test

1. Run the patched backend on port `5000`.
2. Run this frontend with `VITE_ENABLE_DEMO_FALLBACK=false`.
3. Open `/admin/integration` and run checks.
4. Test real flows:
   - login
   - events list
   - event details
   - seat selection
   - checkout
   - payment success
   - customer tickets
   - box-office sell ticket
   - QR verification
   - admin CRUD pages

If a page is empty, that means the backend returned no rows. If a page errors, the backend endpoint or response shape needs to be fixed.
