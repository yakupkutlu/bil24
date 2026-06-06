# Page Map

## Public

| Route | Page |
|---|---|
| `/` | Home page |
| `/events` | Events listing and filters |
| `/events/:eventSlug` | Event details and showtimes |
| `/showtimes/:showtimeId/seats` | Interactive seat map |
| `/checkout` | Protected checkout |
| `/payment/success` | Payment success |
| `/payment/failed` | Payment failed |
| `/verify-ticket/:qrToken` | QR ticket verification |

## Auth

| Route | Page |
|---|---|
| `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |
| `/verify-email` | Verify email |

## Customer

| Route | Page |
|---|---|
| `/customer/dashboard` | Customer dashboard |
| `/customer/tickets` | My tickets |
| `/customer/reservations` | Active reservations |
| `/customer/profile` | Profile and password |
| `/customer/orders` | Orders |
| `/customer/refunds` | Refund requests |

## Box Office

| Route | Page |
|---|---|
| `/box-office/dashboard` | Staff dashboard |
| `/box-office/sell-ticket` | Manual ticket sale |
| `/box-office/verify` | QR verification |
| `/box-office/reservations` | Reservation management |
| `/box-office/today` | Today’s shows |

## Admin

| Route | Page |
|---|---|
| `/admin/dashboard` | Admin dashboard |
| `/admin/events` | Event management |
| `/admin/events/create` | Create event |
| `/admin/events/:id/edit` | Edit event |
| `/admin/showtimes` | Showtime management |
| `/admin/showtimes/create` | Create showtime |
| `/admin/showtimes/:id/edit` | Edit showtime |
| `/admin/halls` | Hall management |
| `/admin/halls/create` | Create hall |
| `/admin/halls/:id/seats` | Seat map designer |
| `/admin/bookings` | Booking management |
| `/admin/bookings/:id` | Booking details |
| `/admin/users` | User management |
| `/admin/users/:id` | User details |
| `/admin/staff` | Staff management |
| `/admin/payments` | Payment management |
| `/admin/refunds` | Refund management |
| `/admin/reports` | Reports |
| `/admin/settings` | Settings |
| `/admin/audit-logs` | Audit logs |
