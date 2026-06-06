# Tiatru Backend Integration Patch 2

This patch hardens the backend for the no-mock frontend build.

## Main fixes

### CORS and frontend headers

The frontend sends production diagnostics headers:

- `X-Tiatru-Client`
- `X-Tiatru-Env`
- `X-Request-Id`

`src/config/cors.js` now allows these headers so browser preflight requests do not fail.

### Event showtime route order

Fixed route ordering so this endpoint works correctly:

```txt
GET /api/events/:eventId/showtimes
```

It is now registered before the generic event slug route.

### Seat lock expiry edge case

Expired seat locks could still block a seat because the unique active-lock index saw the old document as `ACTIVE` until the background cleanup job ran.

Patch 2 now expires old active locks before:

- reading availability
- holding seats

This improves the real flow:

```txt
GET /api/showtimes/:id/seats
POST /api/showtimes/:id/hold-seats
```

### Removed duplicate index warning

`SeatLock.expiresAt` no longer declares both field-level index and explicit TTL index.

### Event admin form compatibility

The backend now accepts frontend-friendly event values:

- `language: "Türkçe"` becomes `tr`
- `language: "English"` becomes `en`
- `language: "Arabic"` becomes `ar`
- `ageLimit: "7+"` becomes `7`
- numeric strings are coerced for `durationMinutes`

Also, `GET /api/events/:slug` can now resolve either a slug or a MongoDB ObjectId. This helps the admin edit page.

### Showtime form compatibility

Showtime create/update now accepts both:

```json
{ "event": "...", "hall": "..." }
```

and:

```json
{ "eventId": "...", "hallId": "..." }
```

Pricing values are coerced to numbers.

### Profile response compatibility

`GET /api/profile`, `PUT /api/profile`, and `PUT /api/profile/preferences` now return the user fields at the top level while keeping aliases:

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "fullName": "...",
    "email": "...",
    "item": {},
    "user": {}
  }
}
```

This matches frontend services that call `unwrap<User>()` directly.

### Settings response and update compatibility

Settings now include frontend aliases:

```json
"theme": {
  "primary": "#7A0C0C",
  "accent": "#B8860B",
  "primaryColor": "#7A0C0C",
  "accentColor": "#B8860B",
  "mode": "dark"
}
```

`PUT /api/settings` accepts both frontend and backend names:

```json
{
  "theme": {
    "primary": "#7A0C0C",
    "accent": "#B8860B"
  }
}
```

and:

```json
{
  "theme": {
    "primaryColor": "#7A0C0C",
    "accentColor": "#B8860B"
  }
}
```

Tax rate can be sent as a percentage such as `20`; backend stores it as `0.2`.

### Reports response compatibility

Report endpoints now return `items` and named arrays so the frontend report charts can read rows:

```txt
GET /api/reports/sales       -> data.items + data.sales
GET /api/reports/events      -> data.items + data.events
GET /api/reports/occupancy   -> data.items + data.occupancy
GET /api/reports/users       -> data.items + data.users
```

Dashboard returns metrics at the top level:

```txt
totalRevenue
ticketsSold
occupancyRate
refundRequests
newUsers
upcomingShows
```

### Payment checkout idempotency

If checkout is called again for an already-paid booking, the backend now returns the existing payment and tickets instead of failing immediately.

This helps retries and box-office print-ticket flows.

### Refund compatibility

Refund create/list now accepts `bookingId` or `booking` and status filters.

Rejecting a refund no longer requires a reason from the frontend.

### Notifications response compatibility

`GET /api/notifications` now returns a direct array for frontend services that call `unwrap<Notification[]>()`.

## Tests run

```bash
npm install
npm run check
find src -name '*.js' -print0 | xargs -0 -n1 node --check
MONGO_URI=mongodb://127.0.0.1:27017/tiatru_test JWT_ACCESS_SECRET=123456789012345678901234567890 JWT_REFRESH_SECRET=123456789012345678901234567890 node -e "import('./src/app.js').then(()=>console.log('app import ok'))"
```

## Next backend patch candidates

Patch 3 should be based on real runtime errors after testing with the no-mock frontend. Expected areas:

- real image upload for event posters/gallery
- real email templates for tickets/password reset
- real Iyzico integration
- better ticket PDF layout
- WebSocket or polling for live seat availability
- richer admin reports
