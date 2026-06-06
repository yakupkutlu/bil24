import dayjs from 'dayjs';
import Showtime from '../showtimes/showtime.model.js';
import Booking from '../bookings/booking.model.js';
import SeatLock from './seatLock.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { BOOKING_STATUS, SEAT_LOCK_STATUS } from '../../utils/constants.js';
import { getSettings } from '../settings/settings.service.js';

async function getShowtimeWithHall(id) {
  const showtime = await Showtime.findById(id).populate('hall event');
  if (!showtime) throw new ApiError(404, 'Showtime not found');
  return showtime;
}

export async function expireLocksForShowtime(showtimeId) {
  await SeatLock.updateMany(
    { showtime: showtimeId, status: SEAT_LOCK_STATUS.ACTIVE, expiresAt: { $lte: new Date() } },
    { $set: { status: SEAT_LOCK_STATUS.EXPIRED } }
  );
}

async function activeSoldSeatCodes(showtimeId) {
  const bookings = await Booking.find({
    showtime: showtimeId,
    status: { $in: [BOOKING_STATUS.PAID, BOOKING_STATUS.RESERVED] },
    expiresAt: { $gt: new Date() }
  }).select('seats.seatCode status expiresAt');

  const paidBookings = await Booking.find({ showtime: showtimeId, status: BOOKING_STATUS.PAID }).select('seats.seatCode');
  return new Set([...bookings, ...paidBookings].flatMap((booking) => booking.seats.map((seat) => seat.seatCode)));
}

async function activeLocks(showtimeId) {
  await expireLocksForShowtime(showtimeId);
  return SeatLock.find({ showtime: showtimeId, status: SEAT_LOCK_STATUS.ACTIVE, expiresAt: { $gt: new Date() } });
}

export async function getAvailability(showtimeId) {
  const showtime = await getShowtimeWithHall(showtimeId);
  const [sold, locks] = await Promise.all([activeSoldSeatCodes(showtimeId), activeLocks(showtimeId)]);
  const locked = new Map(locks.map((lock) => [lock.seatCode, lock]));
  const seats = showtime.hall.seatMap.map((seat) => {
    let status = 'AVAILABLE';
    if (seat.isBlocked) status = 'DISABLED';
    else if (sold.has(seat.code)) status = 'SOLD';
    else if (locked.has(seat.code)) status = 'HELD';
    return {
      code: seat.code,
      row: seat.row,
      number: seat.number,
      category: seat.category,
      price: showtime.pricing?.[seat.category] ?? 0,
      isAccessible: seat.isAccessible,
      isBlocked: seat.isBlocked,
      position: seat.position,
      status
    };
  });
  return { showtime, seats };
}

export async function holdSeats(showtimeId, { seatCodes, sessionId }, user) {
  await expireLocksForShowtime(showtimeId);
  const { showtime, seats } = await getAvailability(showtimeId);
  const normalized = [...new Set(seatCodes.map((code) => code.toUpperCase()))];
  const seatByCode = new Map(seats.map((seat) => [seat.code, seat]));
  const unavailable = [];
  for (const code of normalized) {
    const seat = seatByCode.get(code);
    if (!seat) unavailable.push({ code, reason: 'NOT_FOUND' });
    else if (seat.status !== 'AVAILABLE') unavailable.push({ code, reason: seat.status });
  }
  if (unavailable.length) throw new ApiError(409, 'Some seats are not available', { unavailable });

  const settings = await getSettings();
  const expiresAt = dayjs().add(settings.ticketRules.seatHoldMinutes, 'minute').toDate();
  const locks = [];
  for (const code of normalized) {
    try {
      const lock = await SeatLock.create({ showtime: showtime._id, seatCode: code, user: user?._id, sessionId: sessionId || '', expiresAt });
      locks.push(lock);
    } catch (error) {
      if (error.code === 11000) {
        await expireLocksForShowtime(showtimeId);
        throw new ApiError(409, `Seat ${code} was just held by another user`);
      }
      throw error;
    }
  }
  return { locks, expiresAt };
}

export async function releaseSeats(showtimeId, { seatCodes, sessionId }, user) {
  const normalized = [...new Set(seatCodes.map((code) => code.toUpperCase()))];
  const ownerFilter = user?._id ? { user: user._id } : { sessionId: sessionId || '' };
  const result = await SeatLock.updateMany({ showtime: showtimeId, seatCode: { $in: normalized }, status: SEAT_LOCK_STATUS.ACTIVE, ...ownerFilter }, { status: SEAT_LOCK_STATUS.RELEASED });
  return { released: result.modifiedCount };
}

export async function expireOldLocks() {
  const result = await SeatLock.updateMany({ status: SEAT_LOCK_STATUS.ACTIVE, expiresAt: { $lte: new Date() } }, { status: SEAT_LOCK_STATUS.EXPIRED });
  return { expired: result.modifiedCount };
}
