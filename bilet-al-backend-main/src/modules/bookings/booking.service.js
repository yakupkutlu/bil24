import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import Booking from './booking.model.js';
import User from '../users/user.model.js';
import Showtime from '../showtimes/showtime.model.js';
import SeatLock from '../seats/seatLock.model.js';
import { getAvailability } from '../seats/seat.service.js';
import { getSettings } from '../settings/settings.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { BOOKING_SOURCE, BOOKING_STATUS, ROLES, SEAT_LOCK_STATUS, TICKET_STATUS } from '../../utils/constants.js';
import { generateNumber } from '../../utils/number.js';
import { hashPassword } from '../../utils/password.js';
import Ticket from '../tickets/ticket.model.js';

const STAFF_ROLES = ['BOX_OFFICE', 'EVENT_MANAGER', 'FINANCE', 'ADMIN', 'SUPER_ADMIN'];

function canAccessBooking(booking, user) {
  const staff = STAFF_ROLES.includes(user.role);
  return staff || booking.user.toString() === user._id.toString();
}

function normalizeCustomer(customer = {}) {
  return {
    fullName: customer.fullName?.trim() || 'Walk-in Customer',
    email: customer.email?.trim().toLowerCase() || '',
    phone: customer.phone?.trim() || ''
  };
}

async function resolveBookingUser(payload, actor) {
  const source = payload.source || BOOKING_SOURCE.ONLINE;

  if (source !== BOOKING_SOURCE.BOX_OFFICE) {
    if (!actor) throw new ApiError(401, 'Login is required to create a booking');
    return actor;
  }

  const customer = normalizeCustomer(payload.customer);
  let email = customer.email;
  if (!email) email = `walkin-${Date.now()}-${nanoid(6).toLowerCase()}@tiatru.local`;

  let bookingUser = await User.findOne({ email });
  if (!bookingUser) {
    bookingUser = await User.create({
      fullName: customer.fullName,
      email,
      phone: customer.phone,
      passwordHash: await hashPassword(nanoid(32)),
      role: ROLES.CUSTOMER,
      isEmailVerified: false,
      preferences: { language: 'tr' }
    });
  }

  return bookingUser;
}

export async function createBooking(payload, user) {
  const showtimeId = payload.showtime || payload.showtimeId;
  const showtime = await Showtime.findById(showtimeId).populate('hall event');
  if (!showtime) throw new ApiError(404, 'Showtime not found');

  const bookingUser = await resolveBookingUser(payload, user);
  const customer = normalizeCustomer(payload.customer || payload.customerInfo || {});

  const normalized = [...new Set(payload.seatCodes.map((code) => code.toUpperCase()))];
  const availability = await getAvailability(showtime._id);
  const seatByCode = new Map(availability.seats.map((seat) => [seat.code, seat]));
  const selectedSeats = normalized.map((code) => seatByCode.get(code));
  if (selectedSeats.some((seat) => !seat)) throw new ApiError(400, 'One or more seats do not exist');

  if (payload.source !== BOOKING_SOURCE.BOX_OFFICE) {
    const locks = await SeatLock.find({ showtime: showtime._id, seatCode: { $in: normalized }, status: SEAT_LOCK_STATUS.ACTIVE, expiresAt: { $gt: new Date() }, user: bookingUser._id });
    if (locks.length !== normalized.length) throw new ApiError(409, 'You must hold the selected seats before booking');
  } else {
    const unavailable = selectedSeats.filter((seat) => seat.status !== 'AVAILABLE');
    if (unavailable.length) throw new ApiError(409, 'Some selected seats are unavailable', { unavailable });
  }

  const seats = selectedSeats.map((seat) => ({ seatCode: seat.code, category: seat.category, price: seat.price }));
  const settings = await getSettings();
  const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceFee = settings.ticketRules.serviceFee || 0;
  const discount = payload.discount || 0;
  const tax = Math.max(0, (subtotal + serviceFee - discount) * (settings.ticketRules.taxRate || 0));
  const total = Math.max(0, subtotal + serviceFee + tax - discount);
  const expiresAt = dayjs().add(settings.ticketRules.seatHoldMinutes, 'minute').toDate();

  const booking = await Booking.create({
    bookingNumber: generateNumber('BKG'),
    user: bookingUser._id,
    showtime: showtime._id,
    seats,
    status: BOOKING_STATUS.RESERVED,
    subtotal,
    serviceFee,
    discount,
    tax,
    total,
    expiresAt,
    source: payload.source || BOOKING_SOURCE.ONLINE,
    createdBy: user?._id,
    customerSnapshot: {
      fullName: customer.fullName || bookingUser.fullName,
      email: customer.email || bookingUser.email,
      phone: customer.phone || bookingUser.phone
    }
  });

  await SeatLock.updateMany({ showtime: showtime._id, seatCode: { $in: normalized }, status: SEAT_LOCK_STATUS.ACTIVE }, { status: SEAT_LOCK_STATUS.CONVERTED });
  return getById(booking._id, user || bookingUser);
}

export async function list(query, user, my = false) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (my) filter.user = user._id;
  else {
    if (query.user) filter.user = query.user;
    if (query.showtime || query.showtimeId) filter.showtime = query.showtime || query.showtimeId;
  }
  if (query.status) filter.status = query.status;
  if (query.source) filter.source = query.source;
  if (query.bookingNumber) filter.bookingNumber = query.bookingNumber;
  if (query.search) filter.$text = { $search: query.search };
  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate({ path: 'showtime', populate: ['event', 'hall'] }).populate('user', 'fullName email phone').populate('payment tickets'),
    Booking.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getById(id, user) {
  const booking = await Booking.findById(id).populate({ path: 'showtime', populate: ['event', 'hall'] }).populate('user', 'fullName email phone').populate('payment tickets');
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (user && !canAccessBooking(booking, user)) throw new ApiError(403, 'You cannot access this booking');
  return booking;
}

export async function cancel(id, user, reason = '') {
  const booking = await getById(id, user);
  if (![BOOKING_STATUS.RESERVED, BOOKING_STATUS.PENDING].includes(booking.status)) throw new ApiError(400, 'Only unpaid reservations can be cancelled here; use refund flow for paid bookings');
  booking.status = BOOKING_STATUS.CANCELLED;
  await booking.save();
  await Ticket.updateMany({ booking: booking._id }, { status: TICKET_STATUS.CANCELLED });
  return booking;
}

export async function expire(id) {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== BOOKING_STATUS.RESERVED) throw new ApiError(400, 'Only reserved bookings can expire');
  booking.status = BOOKING_STATUS.EXPIRED;
  await booking.save();
  return booking;
}

export async function expireOldBookings() {
  const result = await Booking.updateMany({ status: BOOKING_STATUS.RESERVED, expiresAt: { $lte: new Date() } }, { status: BOOKING_STATUS.EXPIRED });
  return { expired: result.modifiedCount };
}
