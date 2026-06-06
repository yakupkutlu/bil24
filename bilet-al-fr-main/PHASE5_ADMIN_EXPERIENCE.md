# Phase 5 — Admin Experience Upgrade

Phase 5 upgrades the management side of Tiatru into a production-style admin cockpit.

## Main goal

Make `/admin/*` feel professional, clean, fast, premium, and useful for real operations while keeping the public/customer side emotional and cinematic.

## New reusable admin components

```txt
src/components/admin/AdminPageHeader.tsx
src/components/admin/AdminMetricCard.tsx
src/components/admin/AdminSectionCard.tsx
src/components/admin/AdminQuickAction.tsx
src/components/admin/AdminTimeline.tsx
src/components/admin/AdminProgressBar.tsx
```

These components give admin pages a consistent management style:

- big command-center headers
- animated metric cards
- clean section cards
- progress/readiness bars
- timeline blocks
- quick action cards

## Updated layout

```txt
src/components/layout/SideLayout.tsx
```

Improvements:

- more premium sidebar
- better mobile horizontal navigation
- improved active state
- staff/admin profile card
- theater-gold focus styling

## Updated admin pages

### `/admin/dashboard`

Added:

- command-center hero
- revenue/tickets/occupancy/refund/user metric cards
- sales pulse chart
- operations timeline
- risk queue cards
- best-selling events chart
- payment methods chart
- quick action cards
- tonight-on-stage overview
- executive notes

### `/admin/events`

Added:

- event catalog metrics
- search by title/category/director
- status filter
- poster thumbnails
- view/edit actions
- publish-status badges

### `/admin/events/create` and `/admin/events/:id/edit`

Added:

- premium event form layout
- poster preview
- core details section
- cast/trailer/SEO section
- emotional copy helper placeholder

### `/admin/showtimes`

Added:

- showtime metrics
- readiness board
- occupancy progress
- hall/staff readiness indicators
- searchable/filterable table

### `/admin/showtimes/create` and `/admin/showtimes/:id/edit`

Added:

- event/hall selector
- sale window fields
- pricing by seat category
- status selector

### `/admin/halls`

Added:

- hall metrics
- hall health cards
- occupancy forecast
- improved hall directory

### `/admin/halls/create`

Added:

- rows, capacity, VIP rows, accessible seats, blocked seats
- generate-seats call-to-action

### `/admin/halls/:id/seats`

Added:

- seat map designer command header
- seat category metrics
- save/regenerate actions

### `/admin/bookings`

Added:

- booking metrics
- search and status filter
- export action
- clearer order table

### `/admin/bookings/:id`

Added:

- booking financial summary
- customer/status panel
- seat cards with actions
- cancel/refund/resend actions

### `/admin/users`

Added:

- account metrics
- role search/filter
- open user details action

### `/admin/users/:id`

Added:

- access-control section
- role/status selectors
- reset password action
- orders/tickets summary

### `/admin/staff`

Added:

- staff role metrics
- permission summary by role
- internal user table

### `/admin/payments`

Added:

- payment status metrics
- searchable provider transaction IDs
- status filter
- finance export action

### `/admin/refunds`

Added:

- refund workflow metrics
- searchable queue
- approve/reject/process actions

### `/admin/reports`

Added:

- management header
- PDF/Excel/CSV export buttons
- daily sales chart
- monthly sales chart
- event sales chart
- customer behavior chart
- occupancy and staff progress reports

### `/admin/settings`

Added:

- brand/theme settings
- ticket rules
- payment provider settings
- email/SMS settings
- security reminder cards

### `/admin/audit-logs`

Added:

- audit metrics
- risk filter
- searchable audit trail
- action/module/detail tracking

## New admin local preview data

```txt
backend admin endpoints
```

Includes richer backend data for:

- halls
- users and staff
- payments
- refunds
- audit logs
- reports
- operations timeline
- risk queue
- showtime readiness

## Build test

Phase 5 was tested with:

```bash
npm install
npm run build
```

Build passed successfully.

Vite may still show a normal large-bundle warning because the project includes many pages, Recharts, Framer Motion, and the full admin/customer/box-office UI in one bundle.

## Suggested Phase 6

Phase 6 should focus on backend integration and data wiring:

1. Replace backend admin data with React Query calls.
2. Connect create/edit forms to real backend endpoints.
3. Add toast success/error messages for admin actions.
4. Add confirmation modals for cancel/refund/delete/block actions.
5. Add pagination and server-side filtering for tables.
6. Add code-splitting to reduce bundle size.
