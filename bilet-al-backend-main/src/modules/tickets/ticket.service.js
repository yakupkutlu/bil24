import { nanoid } from 'nanoid';
import Ticket from './ticket.model.js';
import Booking from '../bookings/booking.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { BOOKING_STATUS, TICKET_STATUS } from '../../utils/constants.js';
import { generateNumber } from '../../utils/number.js';
import { buildTicketVerificationUrl, createQrImage } from '../../utils/qr.js';

function isStaff(user) { return ['BOX_OFFICE', 'EVENT_MANAGER', 'FINANCE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role); }

function decorateVerification(result) {
  return {
    ...result,
    canEnter: result.state === TICKET_STATUS.VALID || result.state === 'VALID',
    alreadyUsed: result.state === TICKET_STATUS.USED || result.state === 'USED'
  };
}

export async function createTicketsForBooking(bookingId) {
  const booking = await Booking.findById(bookingId).populate({ path: 'showtime', populate: ['event', 'hall'] });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status !== BOOKING_STATUS.PAID) throw new ApiError(400, 'Booking must be paid before tickets are created');
  const existing = await Ticket.find({ booking: booking._id }).populate('event showtime hall booking user');
  if (existing.length) return existing;
  const showtime = booking.showtime;
  const tickets = [];
  for (const seat of booking.seats) {
    const qrToken = nanoid(48);
    tickets.push(await Ticket.create({
      ticketNumber: generateNumber('TKT'),
      booking: booking._id,
      user: booking.user,
      event: showtime.event._id,
      showtime: showtime._id,
      hall: showtime.hall._id,
      seatCode: seat.seatCode,
      category: seat.category,
      price: seat.price,
      qrToken,
      qrImage: await createQrImage(qrToken)
    }));
  }
  booking.tickets = tickets.map((ticket) => ticket._id);
  await booking.save();
  return Ticket.find({ _id: { $in: tickets.map((ticket) => ticket._id) } }).populate('event showtime hall booking user');
}

export async function list(query, user, my = false) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (my || !isStaff(user)) filter.user = user._id;
  else if (query.user) filter.user = query.user;
  if (query.status) filter.status = query.status;
  if (query.showtime || query.showtimeId) filter.showtime = query.showtime || query.showtimeId;
  if (query.booking || query.bookingId) filter.booking = query.booking || query.bookingId;
  if (query.search) filter.$text = { $search: query.search };
  const [items, total] = await Promise.all([
    Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('event showtime hall booking user', 'title date startTime endTime name bookingNumber fullName email phone status'),
    Ticket.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function get(id, user) {
  const ticket = await Ticket.findById(id).populate('event showtime hall booking user');
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  if (user && !isStaff(user) && ticket.user._id.toString() !== user._id.toString()) throw new ApiError(403, 'You cannot access this ticket');
  return ticket;
}

export async function verify(qrToken) {
  const raw = String(qrToken || '').trim();
  const token = decodeURIComponent(raw.includes('/verify-ticket/') ? raw.split('/verify-ticket/').pop() : raw);
  const ticket = await Ticket.findOne({ qrToken: token }).populate('event showtime hall booking user');
  if (!ticket) return decorateVerification({ state: 'NOT_FOUND', ticket: null });
  let state = ticket.status;
  if (ticket.status === TICKET_STATUS.VALID) state = 'VALID';
  return decorateVerification({ state, ticket });
}

export async function markUsed(id, user) {
  const ticket = await Ticket.findById(id).populate('event showtime hall booking user');
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  if (ticket.status === TICKET_STATUS.USED) throw new ApiError(409, 'Ticket already used');
  if (ticket.status !== TICKET_STATUS.VALID) throw new ApiError(400, `Ticket is ${ticket.status}`);
  ticket.status = TICKET_STATUS.USED;
  ticket.usedAt = new Date();
  ticket.usedBy = user._id;
  await ticket.save();
  return ticket;
}

export async function markUsedByQr(qrToken, user) {
  const result = await verify(qrToken);
  if (!result.ticket) throw new ApiError(404, 'Ticket not found');
  return markUsed(result.ticket._id, user);
}
