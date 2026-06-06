import Booking from '../bookings/booking.model.js';
import Payment from '../payments/payment.model.js';
import Refund from './refund.model.js';
import Ticket from '../tickets/ticket.model.js';
import { getSettings } from '../settings/settings.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { BOOKING_STATUS, PAYMENT_STATUS, REFUND_STATUS, TICKET_STATUS } from '../../utils/constants.js';
import { generateNumber } from '../../utils/number.js';

function isFinance(user) { return ['FINANCE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role); }

export async function createRefund(payload, user) {
  const settings = await getSettings();
  if (!settings.ticketRules.refundAllowed) throw new ApiError(400, 'Refunds are disabled by policy');
  const booking = await Booking.findById(payload.bookingId).populate('payment');
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!isFinance(user) && booking.user.toString() !== user._id.toString()) throw new ApiError(403, 'You cannot refund this booking');
  if (booking.status !== BOOKING_STATUS.PAID) throw new ApiError(400, 'Only paid bookings can be refunded');
  if (!booking.payment) throw new ApiError(400, 'Booking has no payment');
  const amount = payload.amount || booking.total;
  if (amount > booking.total) throw new ApiError(400, 'Refund amount cannot exceed booking total');
  const existing = await Refund.findOne({ booking: booking._id, status: { $in: [REFUND_STATUS.REQUESTED, REFUND_STATUS.APPROVED, REFUND_STATUS.PROCESSING] } });
  if (existing) throw new ApiError(409, 'Refund request already exists');
  return Refund.create({ refundNumber: generateNumber('RFD'), booking: booking._id, payment: booking.payment._id, user: booking.user, amount, reason: payload.reason, requestedBy: user._id });
}

export async function list(query, user) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (!isFinance(user)) filter.user = user._id;
  if (query.status) filter.status = query.status;
  if (query.user && isFinance(user)) filter.user = query.user;
  if (query.booking) filter.booking = query.booking;
  const [items, total] = await Promise.all([Refund.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('booking payment user requestedBy approvedBy'), Refund.countDocuments(filter)]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function get(id, user) {
  const refund = await Refund.findById(id).populate('booking payment user requestedBy approvedBy');
  if (!refund) throw new ApiError(404, 'Refund not found');
  if (!isFinance(user) && refund.user._id.toString() !== user._id.toString()) throw new ApiError(403, 'You cannot access this refund');
  return refund;
}

export async function approve(id, user) {
  const refund = await get(id, user);
  if (refund.status !== REFUND_STATUS.REQUESTED) throw new ApiError(400, 'Only requested refunds can be approved');
  refund.status = REFUND_STATUS.APPROVED;
  refund.approvedBy = user._id;
  await refund.save();
  return refund;
}

export async function reject(id, user, reason) {
  const refund = await get(id, user);
  if (![REFUND_STATUS.REQUESTED, REFUND_STATUS.APPROVED].includes(refund.status)) throw new ApiError(400, 'Refund cannot be rejected now');
  refund.status = REFUND_STATUS.REJECTED;
  refund.rejectionReason = reason || 'Rejected by finance/admin';
  await refund.save();
  return refund;
}

export async function process(id, user) {
  const refund = await get(id, user);
  if (refund.status !== REFUND_STATUS.APPROVED) throw new ApiError(400, 'Refund must be approved before processing');
  refund.status = REFUND_STATUS.REFUNDED;
  refund.processedAt = new Date();
  await refund.save();
  await Booking.findByIdAndUpdate(refund.booking._id, { status: BOOKING_STATUS.REFUNDED });
  await Payment.findByIdAndUpdate(refund.payment._id, { status: PAYMENT_STATUS.REFUNDED });
  await Ticket.updateMany({ booking: refund.booking._id }, { status: TICKET_STATUS.REFUNDED });
  return refund;
}
