import Payment from './payment.model.js';
import Booking from '../bookings/booking.model.js';
import { createTicketsForBooking } from '../tickets/ticket.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { BOOKING_STATUS, PAYMENT_METHOD, PAYMENT_PROVIDER, PAYMENT_STATUS } from '../../utils/constants.js';
import { generateNumber } from '../../utils/number.js';
import { env } from '../../config/env.js';

function isStaff(user) {
  return ['BOX_OFFICE', 'FINANCE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
}


function normalizeCallbackPayload(payload = {}) {
  return {
    paymentId: payload.paymentId || payload.payment_id || payload.conversationId || payload.payment?.id,
    bookingId: payload.bookingId || payload.booking_id || payload.basketId || payload.booking?.id,
    status: String(payload.status || payload.paymentStatus || payload.result || '').toUpperCase(),
    providerTransactionId: payload.providerTransactionId || payload.paymentTransactionId || payload.token || payload.conversationId || '',
    raw: payload
  };
}

async function finalizeSuccessfulPayment(payment, providerResponse = {}) {
  payment.status = PAYMENT_STATUS.SUCCESS;
  payment.providerTransactionId = providerResponse.providerTransactionId || payment.providerTransactionId || generateNumber('TXN');
  payment.providerResponse = { ...(payment.providerResponse || {}), callback: providerResponse.raw || providerResponse };
  payment.paidAt = payment.paidAt || new Date();
  await payment.save();

  const booking = await Booking.findById(payment.booking).populate({ path: 'showtime', populate: ['event', 'hall'] });
  if (booking) {
    booking.payment = payment._id;
    booking.status = BOOKING_STATUS.PAID;
    await booking.save();
  }
  const tickets = booking ? await createTicketsForBooking(booking._id) : [];
  return { payment, booking, tickets };
}

function buildFrontendPaymentUrls(booking, payment) {
  const successUrl = `${env.CLIENT_URL.replace(/\/$/, '')}/payment/success?bookingId=${booking._id}&paymentId=${payment._id}`;
  const failedUrl = `${env.CLIENT_URL.replace(/\/$/, '')}/payment/failed?bookingId=${booking._id}&paymentId=${payment._id}`;
  return {
    redirectUrl: successUrl,
    paymentUrl: successUrl,
    checkoutUrl: successUrl,
    successUrl,
    failedUrl
  };
}

export async function checkout(payload, user) {
  const booking = await Booking.findById(payload.bookingId).populate({ path: 'showtime', populate: ['event', 'hall'] });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!isStaff(user) && booking.user.toString() !== user._id.toString()) throw new ApiError(403, 'You cannot pay this booking');

  if (booking.status === BOOKING_STATUS.PAID) {
    const existingPayment = await Payment.findById(booking.payment);
    const tickets = await createTicketsForBooking(booking._id);
    if (existingPayment) return { payment: existingPayment, booking, tickets, alreadyPaid: true, ...buildFrontendPaymentUrls(booking, existingPayment) };
  }

  if (![BOOKING_STATUS.RESERVED, BOOKING_STATUS.PENDING].includes(booking.status)) throw new ApiError(400, 'Booking is not payable');

  const provider = payload.provider || PAYMENT_PROVIDER.MOCK;
  const method = payload.method || (provider === PAYMENT_PROVIDER.CASH ? PAYMENT_METHOD.CASH : PAYMENT_METHOD.CARD);
  const complimentary = Boolean(payload.complimentary || payload.paymentType === 'COMPLIMENTARY');
  const success = payload.success !== false;
  const amount = complimentary ? 0 : booking.total;

  const payment = await Payment.create({
    paymentNumber: generateNumber('PAY'),
    booking: booking._id,
    user: booking.user,
    provider: complimentary ? PAYMENT_PROVIDER.MOCK : provider,
    method: complimentary ? PAYMENT_METHOD.CASH : method,
    amount,
    currency: env.DEFAULT_CURRENCY,
    status: success ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.FAILED,
    providerTransactionId: success ? generateNumber(complimentary ? 'COMP' : 'TXN') : '',
    providerResponse: {
      mock: provider === PAYMENT_PROVIDER.MOCK || provider === PAYMENT_PROVIDER.CASH || complimentary,
      success,
      complimentary,
      paymentType: payload.paymentType || method,
      source: payload.source || booking.source
    },
    paidAt: success ? new Date() : undefined
  });

  booking.payment = payment._id;
  if (success) booking.status = BOOKING_STATUS.PAID;
  await booking.save();
  const tickets = success ? await createTicketsForBooking(booking._id) : [];
  return { payment, booking, tickets, ...buildFrontendPaymentUrls(booking, payment) };
}

export async function iyzicoCallback(payload) {
  const normalized = normalizeCallbackPayload(payload);
  const success = ['SUCCESS', 'SUCCEEDED', 'PAID', 'OK', 'COMPLETED'].includes(normalized.status) || payload?.success === true;
  const failed = ['FAILED', 'FAILURE', 'DECLINED', 'ERROR'].includes(normalized.status) || payload?.success === false;

  let payment = null;
  if (normalized.paymentId) payment = await Payment.findById(normalized.paymentId);
  if (!payment && normalized.bookingId) payment = await Payment.findOne({ booking: normalized.bookingId }).sort({ createdAt: -1 });
  if (!payment) return { received: true, matched: false, state: 'UNKNOWN_PAYMENT', payload };

  if (success) {
    const result = await finalizeSuccessfulPayment(payment, normalized);
    return { received: true, matched: true, state: 'SUCCESS', ...result, ...buildFrontendPaymentUrls(result.booking, result.payment) };
  }

  if (failed) {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.providerResponse = { ...(payment.providerResponse || {}), callback: payload };
    await payment.save();
    return { received: true, matched: true, state: 'FAILED', payment };
  }

  payment.providerResponse = { ...(payment.providerResponse || {}), callback: payload };
  await payment.save();
  return { received: true, matched: true, state: payment.status, payment };
}

export async function callback(payload) {
  return iyzicoCallback(payload);
}

export async function status(id, user) {
  const payment = await get(id, user);
  const booking = await Booking.findById(payment.booking).populate({ path: 'showtime', populate: ['event', 'hall'] });
  const tickets = booking ? await createTicketsForBooking(booking._id).catch(() => []) : [];
  return { payment, booking, tickets, ...buildFrontendPaymentUrls(booking, payment) };
}

export async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.provider) filter.provider = query.provider;
  if (query.method) filter.method = query.method;
  if (query.user) filter.user = query.user;
  if (query.booking || query.bookingId) filter.booking = query.booking || query.bookingId;
  if (query.search) filter.$text = { $search: query.search };
  const [items, total] = await Promise.all([Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('booking user'), Payment.countDocuments(filter)]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function get(id, user) {
  const payment = await Payment.findById(id).populate('booking user');
  if (!payment) throw new ApiError(404, 'Payment not found');
  const staff = ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'BOX_OFFICE'].includes(user.role);
  if (!staff && payment.user._id.toString() !== user._id.toString()) throw new ApiError(403, 'You cannot access this payment');
  return payment;
}
