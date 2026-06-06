# Tiatru Frontend

Production-style frontend for **Tiatru — Modern Tiyatro Bilet Satış Sistemi**.

Built with:

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- React Query
- Axios
- Zustand
- Framer Motion
- Recharts
- Lucide React

## Install

```bash
npm install
```

## Environment

```bash
cp .env.example .env
```

Update:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Run

```bash
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Build

```bash
npm run build
npm run preview
```

## Backend login accounts expected

The frontend includes backend login behavior for quick UI testing:

```txt
customer@tiatru.com / Password123 -> /customer/dashboard
staff@tiatru.com / Password123 -> /box-office/dashboard
admin@tiatru.com / Password123 -> /admin/dashboard
superadmin@tiatru.com / Password123 -> /admin/dashboard
```

When a real backend is connected, replace the backend login behavior in `src/pages/auth/LoginPage.tsx` with `authService.login`.

## Main folders

```txt
src/app              Router and providers
src/pages/public     Home, events, seat selection, checkout, payment, verification
src/pages/auth       Login, register, password reset, email verification
src/pages/customer   Customer dashboard, tickets, reservations, profile, orders, refunds
src/pages/box-office Staff dashboard, manual sales, QR verification, reservations, today
src/pages/admin      Admin dashboard and management pages
src/components       Reusable UI, layouts, events, seats, tickets, checkout, dashboard
src/services         Axios API service layer
src/stores           Zustand auth store
src/types            Domain and API types
src/constants        Roles and local preview data
src/utils            Formatting and class utilities
```

## Notes

This frontend is ready to connect to the backend contract. Payment provider pages, QR camera scanning, PDF download, uploads, campaign sending, and export buttons require the real backend/provider integrations.


## Phase 1 Emotional Style Upgrade

This version includes a first visual upgrade focused on the public customer experience:

- Cinematic theater background
- Animated curtain opening effect
- Moving spotlights
- Premium gold glow buttons/cards
- Emotional home hero copy
- More attractive event cards
- Improved event details page
- More interactive seat map
- Premium checkout and success pages
- Global Framer Motion page transitions

See `STYLE_UPGRADE.md` for details and the recommended next design phase.

## Phase 2 Buying Flow Upgrade

This version includes the upgraded production-like ticket buying journey:

- animated seat selection page
- countdown-based seat hold UI
- sticky mobile selected-seat summary
- Zustand booking flow store
- checkout progress steps
- animated payment method cards
- ticket preview before payment
- discount code test: `TIATRU10`
- animated success page with generated QR tickets

See `PHASE2_BUYING_FLOW.md` for details.

## Phase 3 Customer Experience Upgrade

This version improves the logged-in customer journey after checkout:

- emotional `/customer/dashboard` with next-ticket hero
- richer `/customer/tickets` with tabs and search
- improved `/customer/reservations` with hold cards and timers
- premium `/customer/orders` archive with price breakdowns
- clearer `/customer/refunds` request and status flow
- polished `/customer/profile` with profile completion and security sections
- new reusable customer components under `src/components/customer`
- richer backend customer data for bookings, reservations, tickets, payments, refunds, and activity charts

See `PHASE3_CUSTOMER_EXPERIENCE.md` for details.

## Phase 4 Box Office Operations Upgrade

This version improves the staff-side ticket operations experience:

- richer `/box-office/dashboard` with live shift hero and gate timeline
- upgraded `/box-office/sell-ticket` with manual-sale stepper, seat map, payment modes and receipt preview
- upgraded `/box-office/verify` with QR/manual token verification, scan log and double-entry prevention simulation
- upgraded `/box-office/reservations` with search, filters and staff action cards
- upgraded `/box-office/today` with hall readiness checklist and staff announcements
- new reusable box-office components under `src/components/box-office`
- new `src/services/boxOffice.service.ts` wrapper for staff booking, payment and ticket verification flows

See `PHASE4_BOX_OFFICE_OPERATIONS.md` for details.

## Phase 5 Admin Experience Upgrade

This version improves the admin and management experience:

- premium `/admin/dashboard` command center
- upgraded event, showtime, hall, booking, user, staff, payment, refund, report, settings, and audit pages
- reusable admin components under `src/components/admin`
- admin pages now load data from backend admin endpoints
- improved sidebar layout for admin/staff pages
- stronger charts, filters, readiness boards, progress cards, and action areas
- professional admin style while keeping public pages emotional and cinematic

See `PHASE5_ADMIN_EXPERIENCE.md` for details.

## Phase 6 Backend Integration

This version includes Phase 6 backend integration helpers. The frontend now tries the real backend API first and can fall back to backend data while the backend is still being developed.

Important files:

```txt
src/services/api.ts
src/hooks/useApiResource.ts
src/components/integration/ApiModeBadge.tsx
src/components/integration/ApiFallbackNotice.tsx
src/utils/apiAdapters.ts
PHASE6_BACKEND_INTEGRATION.md
BACKEND_INTEGRATION_CHECKLIST.md
```

Configure:

```txt
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=true
```

Set `VITE_ENABLE_DEMO_FALLBACK=false` for strict backend-only testing.

## Phase 7 Real Backend Verification

This version adds strict backend verification tooling:

- `/admin/integration` endpoint checker
- better API timeout/error normalization
- strict backend mode support
- frontend/backend fix reports

Use:

```env
VITE_ENABLE_DEMO_FALLBACK=false
```

See `PHASE7_REAL_BACKEND_VERIFICATION.md` for details.

## Phase 8 Admin Real CRUD

This version connects admin management screens to real backend mutations:

- events CRUD
- showtimes CRUD
- halls and seat map save
- users/staff role and status updates
- bookings cancel/expire
- refunds approve/reject/process
- settings update

See `PHASE8_ADMIN_REAL_CRUD.md` for details.

## Phase 9 Payment, QR and PDF Ticket Readiness

This version improves production payment and ticket readiness:

- payment redirect/callback support
- real ticket fetch by booking
- ticket PDF download hook
- ticket resend email hook
- print ticket action
- browser QR scanner with manual token input
- public ticket verification page

See `PHASE9_PAYMENT_QR_PDF_TICKETS.md` for details.

## Phase 10 Production Polish

This version adds final frontend production polish:

- app-level `ErrorBoundary`
- branded `/500` page
- route SEO metadata system
- `robots.txt`, `sitemap.xml`, and web manifest
- accessibility skip link and focus states
- reduced-motion support
- Vite manual chunk splitting
- React Query cache/stale timing
- production API headers: `X-Tiatru-Client`, `X-Tiatru-Env`, `X-Request-Id`
- admin `/admin/production` release checklist page
- deployment, security, and final production checklists

See:

```txt
PHASE10_PRODUCTION_POLISH.md
DEPLOYMENT_GUIDE.md
PRODUCTION_CHECKLIST.md
SECURITY_FRONTEND_CHECKLIST.md
```

Production env example:

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_APP_ENV=production
VITE_ENABLE_DEMO_FALLBACK=false
```


## Backend-only integration update

This ZIP removes the local preview data layer. Public, customer, box-office, and admin pages now depend on the backend API through the service layer. See `NO_MOCK_BACKEND_INTEGRATION.md` for exact endpoints and test steps.

Required frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=false
VITE_APP_ENV=development
```
