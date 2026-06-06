# Database Schema Summary

## User
Stores fullName, email, phone, passwordHash, role, avatar, verification status, account status, preferences, refresh tokens, password reset tokens, and login metadata.

## Event
Stores title, slug, descriptions, poster/gallery/trailer, category, language, duration, age limit, cast, director, status, SEO, creator/updater.

## Hall
Stores hall name, capacity, rows, seatsPerRow, and `seatMap` with row/number/code/category/accessibility/blocking/position.

## Showtime
Stores event, hall, date, start/end time, status, per-category pricing, sale window, and cancellation policy.

## SeatLock
Temporary seat reservation with showtime, seatCode, user/sessionId, expiry, and status. Active locks have a unique partial index.

## Booking
Stores bookingNumber, user, showtime, seats, status, subtotal/serviceFee/discount/tax/total, expiry, payment, tickets, source, staff creator, and customer snapshot.

## Ticket
Stores ticketNumber, booking/user/event/showtime/hall, seat, QR token/image, status, and usage metadata.

## Payment
Stores paymentNumber, booking, user, provider, method, amount, currency, status, provider transaction data, and paidAt.

## Refund
Stores refundNumber, booking, payment, user, amount, reason, status, reviewer, rejection reason, and processedAt.

## Notification
Stores user, type, title, message, channel, status, related entity, read/sent timestamps.

## AuditLog
Stores actor, action, module, entityId, old/new values, IP, user agent, and creation timestamp.

## SystemSettings
Stores website settings, theme, payment/email/SMS placeholders, ticket rules, maintenance mode, and updater.
