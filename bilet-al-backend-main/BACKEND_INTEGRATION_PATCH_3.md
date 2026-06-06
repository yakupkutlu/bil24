# Backend Integration Patch 3 — Payment, QR, PDF, Email, Media Hardening

This patch builds on Patch 2 and focuses on the remaining production-readiness gaps needed by the no-mock frontend.

## Main changes

### 1. Fixed QR generation bug

Tickets now generate QR images from the final frontend verification URL:

```txt
CLIENT_URL/verify-ticket/<qrToken>
```

The QR utility now accepts either a raw `qrToken` or an already-built verification URL without double-wrapping the URL.

Updated:

```txt
src/utils/qr.js
src/modules/tickets/ticket.service.js
```

### 2. Improved ticket PDF output

`GET /api/tickets/:id/download` now streams a more production-like ticket PDF with:

```txt
Tiatru branded dark ticket design
Ticket number
Booking number
Customer name
Event title
Date/time
Hall
Seat/category
Status
Price
QR code
Verification link
Entry rules
```

Updated:

```txt
src/utils/pdf.js
```

### 3. Added SMTP-ready ticket emails

`POST /api/tickets/:id/resend-email` now sends a real HTML/text ticket email when SMTP variables are configured.

If SMTP is not configured, it safely runs in log-only mode.

Required `.env` values for real email:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_password
EMAIL_FROM="Tiatru <noreply@tiatru.com>"
```

Updated:

```txt
src/utils/email.js
src/modules/tickets/ticket.controller.js
package.json
package-lock.json
```

### 4. Added generic payment callback endpoint

The backend now supports provider callbacks through both:

```txt
POST /api/payments/iyzico/callback
GET  /api/payments/iyzico/callback
POST /api/payments/callback
GET  /api/payments/callback
```

Callback payloads can include:

```txt
paymentId
bookingId
status
paymentStatus
providerTransactionId
token
conversationId
```

Successful callbacks mark payment as `SUCCESS`, mark booking as `PAID`, and generate tickets.

Added status endpoint:

```txt
GET /api/payments/:id/status
```

Updated:

```txt
src/modules/payments/payment.service.js
src/modules/payments/payment.controller.js
src/modules/payments/payment.routes.js
```

### 5. Added event poster/gallery upload endpoints

Admins/staff can now upload event poster and gallery images directly.

New endpoints:

```txt
POST /api/media/events/:eventId/poster
field: file

POST /api/media/events/:eventId/gallery
fields: files[] or file[]
```

The backend uploads the image, creates a media record, and updates the event:

```txt
posterImage
or
gallery[]
```

Updated:

```txt
src/modules/media/media.routes.js
src/modules/media/media.controller.js
src/modules/media/media.service.js
src/modules/media/media.validator.js
```

### 6. Improved media list compatibility

`GET /api/media` now returns:

```json
{
  "data": {
    "items": [],
    "media": []
  },
  "meta": {}
}
```

It also supports filters:

```txt
module
mimetype
```

### 7. Fixed report date filters

Report date filters now convert `dateFrom` and `dateTo` into real `Date` objects before Mongo aggregation.

Updated:

```txt
src/modules/reports/report.service.js
```

### 8. Dependency security cleanup

Updated:

```txt
multer -> 2.x
nodemailer -> 8.x
```

Validated with:

```bash
npm audit --omit=dev
```

Result:

```txt
found 0 vulnerabilities
```

## New/updated endpoints

```txt
GET  /api/payments/:id/status
POST /api/payments/callback
GET  /api/payments/callback
POST /api/payments/iyzico/callback
GET  /api/payments/iyzico/callback
POST /api/media/events/:eventId/poster
POST /api/media/events/:eventId/gallery
```

## Testing commands used

```bash
npm install
npm run check
find src -name '*.js' -print0 | xargs -0 -n1 node --check
npm audit --omit=dev
NODE_ENV=development MONGO_URI=mongodb://127.0.0.1:27017/tiatru JWT_ACCESS_SECRET=change_me_access_secret_at_least_32_chars JWT_REFRESH_SECRET=change_me_refresh_secret_at_least_32_chars node -e "import('./src/app.js').then(()=>console.log('app import ok'))"
```

## Suggested frontend tests after this patch

```txt
/customer/tickets -> Download PDF
/customer/tickets -> Resend email
/verify-ticket/:qrToken -> public verification
/box-office/verify -> verify and mark used
/admin/events/create -> use media URL or upload endpoint if wired
/admin/reports -> date filters
/payment/callback -> payment provider callback flow
```
