# Phase 7 — Real Backend Verification and Frontend/Backend Fixes

Phase 7 moves Tiatru from a beautiful API-ready frontend into a strict backend verification workflow.

## Main goal

Run the frontend with the real backend and discover every mismatch early:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=false
```

In backend-only mode, the frontend fails loudly instead of hiding backend issues with backend data.

## New in this phase

### 1. Integration dashboard

Added:

```txt
/admin/integration
```

This page shows:

- current `VITE_API_BASE_URL`
- whether backend-only mode is enabled or disabled
- automatic safe endpoint checks
- endpoints that require manual IDs or write actions
- pass/fail/manual counters
- clear next-fix messages

### 2. Stronger API client

Updated:

```txt
src/services/api.ts
```

Improvements:

- timeout added
- strict backend constants
- stronger error normalization
- error status/code/url/method details
- safer refresh-token retry logic
- auth login/register no longer trigger refresh retry loops
- `unwrapList()` helper for different backend response shapes

### 3. Endpoint contract matrix

Added:

```txt
src/services/integration.service.ts
```

It tracks expected endpoint coverage for:

- public events/showtimes/settings
- auth
- profile
- customer bookings/tickets
- seat availability and holds
- booking creation
- payment checkout
- QR verification
- admin reports/users/payments/refunds/audit logs

### 4. Integration UI components

Added:

```txt
src/components/integration/EndpointCheckTable.tsx
src/components/integration/IntegrationConfigCard.tsx
```

## Testing order

### Step 1 — Start backend

From backend project:

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

Make sure backend runs on:

```txt
http://localhost:5000/api
```

### Step 2 — Start frontend in strict mode

```bash
cp .env.example .env
```

Set:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=false
```

Then:

```bash
npm install
npm run dev
```

### Step 3 — Login first

Test seed accounts:

```txt
superadmin@tiatru.com / Password123
admin@tiatru.com / Password123
staff@tiatru.com / Password123
customer@tiatru.com / Password123
```

Expected login response shape:

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "role": "ADMIN" },
    "accessToken": "..."
  }
}
```

Also accepted:

```json
{
  "user": { "id": "...", "role": "ADMIN" },
  "accessToken": "..."
}
```

### Step 4 — Open integration page

```txt
/admin/integration
```

Click:

```txt
Run checks
```

Fix any failed endpoint before continuing.

## Manual flow tests

Some endpoints are not tested automatically because they create or mutate data.

### Customer buying flow

```txt
/events
/events/:slug
/showtimes/:showtimeId/seats
/checkout
/payment/success
/customer/tickets
```

Backend endpoints involved:

```txt
GET /api/events
GET /api/events/:slug
GET /api/events/:eventId/showtimes
GET /api/showtimes/:id/seats
POST /api/showtimes/:id/hold-seats
POST /api/bookings
POST /api/payments/checkout
GET /api/tickets/my
```

### Box-office manual sale flow

```txt
/box-office/sell-ticket
```

Backend endpoints involved:

```txt
GET /api/events
GET /api/showtimes
GET /api/showtimes/:id/seats
POST /api/bookings
POST /api/payments/checkout
GET /api/tickets?bookingId=<bookingId>
```

### Box-office QR flow

```txt
/box-office/verify
```

Backend endpoints involved:

```txt
POST /api/tickets/verify
POST /api/tickets/:id/mark-used
```

### Admin flow

```txt
/admin/dashboard
/admin/events
/admin/showtimes
/admin/halls
/admin/users
/admin/payments
/admin/refunds
/admin/settings
/admin/audit-logs
/admin/integration
```

## Common mismatch fixes

### Backend returns `_id` instead of `id`

Frontend adapters support this. Keep returning `_id` if needed, but returning both is best:

```js
{ _id, id: _id.toString() }
```

### Backend returns `{ data: { items: [] } }`

Frontend now supports common list shapes, but the cleanest response is:

```json
{
  "success": true,
  "data": []
}
```

or:

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0
  }
}
```

### Seat endpoint shape

Expected:

```json
{
  "success": true,
  "data": {
    "seats": [
      { "code": "A1", "category": "VIP", "price": 500, "status": "AVAILABLE" }
    ]
  }
}
```

### Login role mismatch

Frontend supports these roles exactly:

```txt
CUSTOMER
BOX_OFFICE
EVENT_MANAGER
FINANCE
ADMIN
SUPER_ADMIN
```

### Ticket filtering by booking

The connected box-office print flow tries:

```txt
GET /api/tickets?bookingId=<bookingId>
```

If your backend does not support this, either:

1. make `/api/payments/checkout` return generated tickets, or
2. add `bookingId` filter to `/api/tickets`.

## Phase 7 completion condition

Phase 7 is complete when:

- strict mode is enabled
- login works for every seed role
- `/admin/integration` safe checks pass or expected auth-protected failures are understood
- customer buying flow creates real booking/payment/tickets
- box-office print button creates real tickets
- QR verification marks a real ticket as used
- admin event CRUD works with real backend
