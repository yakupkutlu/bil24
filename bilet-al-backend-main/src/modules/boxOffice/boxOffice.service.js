import { BOOKING_SOURCE, PAYMENT_METHOD, PAYMENT_PROVIDER } from '../../utils/constants.js';
import * as bookingService from '../bookings/booking.service.js';
import * as paymentService from '../payments/payment.service.js';

export async function sellTicket(payload, actor) {
  const booking = await bookingService.createBooking({
    showtime: payload.showtime || payload.showtimeId,
    seatCodes: payload.seatCodes,
    customer: payload.customer || payload.customerInfo,
    discount: payload.discount,
    source: BOOKING_SOURCE.BOX_OFFICE
  }, actor);

  const paymentType = payload.paymentType || 'CASH';
  const checkout = await paymentService.checkout({
    bookingId: booking._id.toString(),
    provider: paymentType === 'CARD' ? PAYMENT_PROVIDER.MOCK : PAYMENT_PROVIDER.CASH,
    method: paymentType === 'CARD' ? PAYMENT_METHOD.CARD : PAYMENT_METHOD.CASH,
    paymentType,
    complimentary: paymentType === 'COMPLIMENTARY',
    source: BOOKING_SOURCE.BOX_OFFICE,
    customerInfo: payload.customer || payload.customerInfo,
    success: payload.success
  }, actor);

  return checkout;
}
