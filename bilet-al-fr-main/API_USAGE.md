# API Usage

All API calls use `src/services/api.ts`.

```ts
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```

The Axios instance includes:

- Base URL from env
- `withCredentials: true` for HttpOnly refresh cookie
- Access token from Zustand store
- Automatic `/auth/refresh` retry on 401
- Normalized API errors

## Service modules

```txt
auth.service.ts
profile.service.ts
users.service.ts
events.service.ts
halls.service.ts
showtimes.service.ts
seats.service.ts
bookings.service.ts
tickets.service.ts
payments.service.ts
refunds.service.ts
reports.service.ts
notifications.service.ts
settings.service.ts
auditLogs.service.ts
```

## Expected backend endpoints

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/verify-email
```

### Profile

```txt
GET /api/profile
PUT /api/profile
PUT /api/profile/password
PUT /api/profile/preferences
```

### Events, halls, showtimes, seats

```txt
GET /api/events
GET /api/events/:slug
POST /api/events
PUT /api/events/:id
DELETE /api/events/:id
PATCH /api/events/:id/status

GET /api/halls
GET /api/halls/:id
POST /api/halls
PUT /api/halls/:id
DELETE /api/halls/:id
POST /api/halls/:id/generate-seats
PUT /api/halls/:id/seats

GET /api/showtimes
GET /api/showtimes/:id
GET /api/events/:eventId/showtimes
POST /api/showtimes
PUT /api/showtimes/:id
DELETE /api/showtimes/:id
PATCH /api/showtimes/:id/status

GET /api/showtimes/:id/seats
POST /api/showtimes/:id/hold-seats
POST /api/showtimes/:id/release-seats
```

### Booking, payment, ticket, refund

```txt
POST /api/bookings
GET /api/bookings/my
GET /api/bookings
GET /api/bookings/:id
PATCH /api/bookings/:id/cancel
PATCH /api/bookings/:id/expire

POST /api/payments/checkout
POST /api/payments/iyzico/callback
GET /api/payments/:id
GET /api/payments

GET /api/tickets/my
GET /api/tickets
GET /api/tickets/:id
GET /api/tickets/:id/download
POST /api/tickets/verify
POST /api/tickets/:id/mark-used
POST /api/tickets/:id/resend-email

POST /api/refunds
GET /api/refunds
GET /api/refunds/:id
PATCH /api/refunds/:id/approve
PATCH /api/refunds/:id/reject
PATCH /api/refunds/:id/process
```

### Admin

```txt
GET /api/reports/dashboard
GET /api/reports/sales
GET /api/reports/events
GET /api/reports/occupancy
GET /api/reports/users
GET /api/reports/export
GET /api/settings
PUT /api/settings
GET /api/audit-logs
GET /api/audit-logs/:id
```
