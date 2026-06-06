# Testing Guide

## 1. Install and run

```bash
npm install
cp .env.example .env
npm run dev
```

## 2. Public flow

1. Open `/`
2. Go to `/events`
3. Open an event details page
4. Click a showtime
5. Select seats
6. Continue to `/checkout`
7. Complete backend payment
8. Confirm `/payment/success`

## 3. Customer flow

1. Login with `customer@tiatru.com / Password123`
2. Check `/customer/dashboard`
3. Check tickets, reservations, profile, orders, and refunds

## 4. Box office flow

1. Login with `staff@tiatru.com / Password123`
2. Check `/box-office/dashboard`
3. Use manual sale page
4. Test QR verification with a real qrToken returned by the backend

## 5. Admin flow

1. Login with `admin@tiatru.com / Password123`
2. Open `/admin/dashboard`
3. Test events, showtimes, halls, bookings, users, staff, payments, refunds, reports, settings, and audit logs pages

## 6. Backend integration checks

After backend is running:

- Set `VITE_API_BASE_URL`
- Replace backend login handler with `authService.login`
- Confirm refresh token cookie behavior
- Confirm seat availability refresh
- Confirm hold/release seat behavior
- Confirm checkout creates payment and tickets
- Confirm QR verification returns real ticket status
- Confirm PDF ticket downloads from backend
