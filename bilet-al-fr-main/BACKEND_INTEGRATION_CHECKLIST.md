# Backend Integration Checklist

Use this checklist after starting the Express/MongoDB backend.

## 1. Configure frontend

```bash
cp .env.example .env
```

```txt
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=true
```

## 2. Auth

- [ ] `POST /api/auth/login` returns `{ data: { user, accessToken } }` or `{ user, accessToken }`
- [ ] refresh token is set as HttpOnly cookie
- [ ] `POST /api/auth/refresh` returns a new access token
- [ ] blocked users return 403/401

## 3. Events and showtimes

- [ ] `GET /api/events` returns events array or paginated object
- [ ] `GET /api/events/:slug` returns one event
- [ ] `GET /api/events/:eventId/showtimes` returns showtimes
- [ ] showtime event/hall can be populated objects or IDs

## 4. Seats

- [ ] `GET /api/showtimes/:id/seats` returns `{ seats: [...] }`
- [ ] seats include `code`, `category`, `price`, `status`
- [ ] `POST /api/showtimes/:id/hold-seats` accepts `{ seatCodes, sessionId }`

## 5. Booking and payment

- [ ] `POST /api/bookings` accepts `{ showtimeId, seatCodes, source, customerInfo }`
- [ ] booking response includes `id` and `bookingNumber`
- [ ] `POST /api/payments/checkout` accepts `{ bookingId, provider, method }`
- [ ] successful payment creates tickets

## 6. Tickets

- [ ] `GET /api/tickets/my` returns current user tickets
- [ ] `POST /api/tickets/verify` accepts `{ qrToken }`
- [ ] `POST /api/tickets/:id/mark-used` returns updated ticket
- [ ] double scan returns USED state

## 7. Admin

- [ ] `GET /api/reports/dashboard` returns revenue, tickets sold, occupancy, refunds, users, upcoming shows
- [ ] `GET /api/events` works for admin event catalog

## 8. Strict mode test

After the backend is ready:

```txt
VITE_ENABLE_DEMO_FALLBACK=false
```

Then run:

```bash
npm run dev
```

Now pages should fail loudly if an endpoint is missing.
