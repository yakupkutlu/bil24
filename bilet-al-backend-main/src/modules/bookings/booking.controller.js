import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './booking.service.js';

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await service.createBooking(req.body, req.user);
  await writeAuditLog({ req, action: 'CREATE_BOOKING', module: 'bookings', entityId: booking._id, newValue: req.body });
  sendResponse(res, { statusCode: 201, message: 'Booking created', data: { item: booking, booking } });
});
export const myBookings = asyncHandler(async (req, res) => {
  const result = await service.list(req.query, req.user, true);
  sendResponse(res, { data: { items: result.items, bookings: result.items }, meta: result.meta });
});
export const listBookings = asyncHandler(async (req, res) => {
  const result = await service.list(req.query, req.user, false);
  sendResponse(res, { data: { items: result.items, bookings: result.items }, meta: result.meta });
});
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await service.getById(req.params.id, req.user);
  sendResponse(res, { data: { item: booking, booking } });
});
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await service.cancel(req.params.id, req.user, req.body?.reason);
  await writeAuditLog({ req, action: 'CANCEL_BOOKING', module: 'bookings', entityId: booking._id });
  sendResponse(res, { message: 'Booking cancelled', data: { item: booking, booking } });
});
export const expireBooking = asyncHandler(async (req, res) => {
  const booking = await service.expire(req.params.id);
  await writeAuditLog({ req, action: 'EXPIRE_BOOKING', module: 'bookings', entityId: booking._id });
  sendResponse(res, { message: 'Booking expired', data: { item: booking, booking } });
});
