# Box Office Generate and Print Ticket Button

This update activates the **Generate and print ticket** button in:

```txt
src/components/box-office/PaymentReceiptPreview.tsx
```

## Connected backend flow

When staff clicks the button from `/box-office/sell-ticket`, the frontend now runs this live backend sequence:

```txt
1. POST /api/bookings
2. POST /api/payments/checkout
3. GET /api/tickets?bookingId=<createdBookingId>
4. window.print()
```

## Booking request

```json
{
  "showtimeId": "showtime_id",
  "seatCodes": ["B1", "B2"],
  "seats": [
    { "seatCode": "B1", "category": "STANDARD", "price": 300 }
  ],
  "customerInfo": {
    "fullName": "Walk-in Guest",
    "phone": "+90 555 000 0000"
  },
  "source": "BOX_OFFICE",
  "subtotal": 600,
  "serviceFee": 25,
  "total": 625
}
```

## Payment checkout request

For cash:

```json
{
  "bookingId": "created_booking_id",
  "provider": "CASH",
  "method": "CASH",
  "source": "BOX_OFFICE",
  "paymentType": "CASH",
  "amount": 625,
  "complimentary": false
}
```

For card:

```json
{
  "bookingId": "created_booking_id",
  "provider": "MOCK",
  "method": "CARD",
  "source": "BOX_OFFICE",
  "paymentType": "CARD",
  "amount": 625,
  "complimentary": false
}
```

For complimentary:

```json
{
  "bookingId": "created_booking_id",
  "provider": "MOCK",
  "method": "CASH",
  "source": "BOX_OFFICE",
  "paymentType": "COMPLIMENTARY",
  "amount": 0,
  "complimentary": true
}
```

## Files changed

```txt
src/components/box-office/PaymentReceiptPreview.tsx
src/pages/box-office/SellTicketPage.tsx
src/services/boxOffice.service.ts
```

## Test steps

1. Start backend on `http://localhost:5000`.
2. In frontend `.env`, use:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENABLE_DEMO_FALLBACK=false
```

3. Run frontend:

```bash
npm install
npm run dev
```

4. Open:

```txt
/box-office/sell-ticket
```

5. Select showtime, seats, customer name, payment method.
6. Click **Generate and print ticket**.
7. Expected result:
   - booking is created in backend
   - payment checkout is called
   - generated tickets are fetched by booking id
   - success toast appears
   - browser print dialog opens

## Backend expectation

The backend should create tickets after payment checkout. If tickets are returned directly from `/payments/checkout`, the frontend uses them immediately. If not, it calls:

```txt
GET /api/tickets?bookingId=<bookingId>
```

If the backend does not support this filter yet, add it to the tickets list endpoint.
