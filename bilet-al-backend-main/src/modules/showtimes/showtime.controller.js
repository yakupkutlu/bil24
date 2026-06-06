import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './showtime.service.js';

export const listShowtimes = asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  sendResponse(res, { data: { items: result.items, showtimes: result.items }, meta: result.meta });
});
export const getShowtime = asyncHandler(async (req, res) => {
  const showtime = await service.get(req.params.id);
  sendResponse(res, { data: { item: showtime, showtime } });
});
export const eventShowtimes = asyncHandler(async (req, res) => {
  const result = await service.byEvent(req.params.eventId, req.query);
  sendResponse(res, { data: { items: result.items, showtimes: result.items }, meta: result.meta });
});
export const createShowtime = asyncHandler(async (req, res) => {
  const showtime = await service.create(req.body);
  await writeAuditLog({ req, action: 'CREATE_SHOWTIME', module: 'showtimes', entityId: showtime._id, newValue: req.body });
  sendResponse(res, { statusCode: 201, message: 'Showtime created', data: { item: showtime, showtime } });
});
export const updateShowtime = asyncHandler(async (req, res) => {
  const showtime = await service.update(req.params.id, req.body);
  await writeAuditLog({ req, action: 'UPDATE_SHOWTIME', module: 'showtimes', entityId: showtime._id, newValue: req.body });
  sendResponse(res, { message: 'Showtime updated', data: { item: showtime, showtime } });
});
export const deleteShowtime = asyncHandler(async (req, res) => {
  const showtime = await service.remove(req.params.id);
  await writeAuditLog({ req, action: 'DELETE_SHOWTIME', module: 'showtimes', entityId: showtime._id });
  sendResponse(res, { message: 'Showtime deleted', data: { item: showtime, showtime } });
});
export const changeStatus = asyncHandler(async (req, res) => {
  const showtime = await service.changeStatus(req.params.id, req.body.status);
  await writeAuditLog({ req, action: 'CHANGE_SHOWTIME_STATUS', module: 'showtimes', entityId: showtime._id, newValue: { status: req.body.status } });
  sendResponse(res, { message: 'Showtime status updated', data: { item: showtime, showtime } });
});
