# Phase 8 — Admin Real CRUD Workflows

Phase 8 moves the admin panel from mostly visual management pages into API-connected CRUD workflows.

## Main goal

Run the admin area against the real backend using:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=false
```

When backend-only mode is enabled, pages still remain previewable, but all main admin actions are now wired to the backend service layer.

## Connected admin pages

### Events

Files:

- `src/pages/admin/AdminEventsPage.tsx`
- `src/pages/admin/AdminEventFormPage.tsx`

Connected endpoints:

- `GET /api/events`
- `POST /api/events`
- `PUT /api/events/:id`
- `PATCH /api/events/:id/status`
- `DELETE /api/events/:id`

Actions:

- Create event
- Edit event
- Publish/draft/archive/cancel event
- Delete event
- Search/filter events

### Showtimes

Files:

- `src/pages/admin/AdminShowtimesPage.tsx`
- `src/pages/admin/AdminShowtimeFormPage.tsx`

Connected endpoints:

- `GET /api/showtimes`
- `POST /api/showtimes`
- `PUT /api/showtimes/:id`
- `PATCH /api/showtimes/:id/status`
- `DELETE /api/showtimes/:id`
- `GET /api/events`
- `GET /api/halls`

Actions:

- Create showtime
- Edit showtime
- Change showtime status
- Cancel showtime
- Delete showtime
- Load event/hall dropdowns from backend

### Halls and seat maps

Files:

- `src/pages/admin/AdminHallsPage.tsx`
- `src/pages/admin/AdminHallCreatePage.tsx`
- `src/pages/admin/AdminHallSeatsPage.tsx`
- `src/components/seats/SeatMapDesigner.tsx`

Connected endpoints:

- `GET /api/halls`
- `GET /api/halls/:id`
- `POST /api/halls`
- `PUT /api/halls/:id`
- `DELETE /api/halls/:id`
- `POST /api/halls/:id/generate-seats`
- `PUT /api/halls/:id/seats`

Actions:

- Create hall
- Create hall and generate seats
- Change hall status
- Delete hall
- Regenerate seat layout
- Edit seat category/block/accessibility locally
- Save seat map to backend

### Users and staff

Files:

- `src/pages/admin/AdminUsersPage.tsx`
- `src/pages/admin/AdminStaffPage.tsx`

Connected endpoints:

- `GET /api/users`
- `PATCH /api/users/:id/role`
- `PATCH /api/users/:id/status`
- `DELETE /api/users/:id`

Actions:

- Search/filter users
- Change role inline
- Change status inline
- Block/unblock user
- Delete user
- Staff permission overview from backend users

### Bookings

File:

- `src/pages/admin/AdminBookingsPage.tsx`

Connected endpoints:

- `GET /api/bookings`
- `PATCH /api/bookings/:id/cancel`
- `PATCH /api/bookings/:id/expire`

Actions:

- Search/filter bookings
- Cancel booking
- Expire pending/reserved booking
- Open booking details

### Refunds

File:

- `src/pages/admin/AdminRefundsPage.tsx`

Connected endpoints:

- `GET /api/refunds`
- `PATCH /api/refunds/:id/approve`
- `PATCH /api/refunds/:id/reject`
- `PATCH /api/refunds/:id/process`

Actions:

- Approve refund
- Reject refund
- Process refund
- Filter refund queue

### Payments

File:

- `src/pages/admin/AdminPaymentsPage.tsx`

Connected endpoint:

- `GET /api/payments`

Actions:

- Live payment ledger
- Filter by status
- Search provider transaction IDs

### Settings

File:

- `src/pages/admin/AdminSettingsPage.tsx`

Connected endpoints:

- `GET /api/settings`
- `PUT /api/settings`

Actions:

- Update website name/logo/theme
- Update maintenance mode
- Update seat hold minutes
- Update cancellation deadline
- Update refund allowed flag
- Update service fee and tax rate

### Audit logs

File:

- `src/pages/admin/AdminAuditLogsPage.tsx`

Connected endpoint:

- `GET /api/audit-logs`

Actions:

- Live audit log table
- Search/filter logs

## New helper files

- `src/hooks/useAdminMutation.ts`
- `src/components/admin/AdminCrudStatus.tsx`

These provide consistent mutation loading state, success/error toasts, and cache invalidation.

## Test checklist

1. Start backend on port `5000`.
2. Start frontend with strict backend mode:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=false
```

3. Login as admin/super admin.
4. Test:

```txt
/admin/events
/admin/events/create
/admin/showtimes
/admin/showtimes/create
/admin/halls
/admin/halls/create
/admin/halls/:id/seats
/admin/users
/admin/staff
/admin/bookings
/admin/refunds
/admin/payments
/admin/settings
/admin/audit-logs
```

## Backend compatibility notes

The frontend expects backend responses in one of these common shapes:

```json
{ "data": [...] }
{ "data": { "items": [...] } }
{ "items": [...] }
{ "docs": [...] }
{ "results": [...] }
```

The adapter layer normalizes MongoDB `_id` into frontend `id`.

For ticketing production, the next phase should focus on payment, QR, PDF, real scanner, and provider flows.
