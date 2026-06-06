import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as service from './seat.service.js';

export const getSeats = asyncHandler(async (req, res) => {
  const result = await service.getAvailability(req.params.id);
  sendResponse(res, { data: { showtime: result.showtime, seats: result.seats } });
});
export const holdSeats = asyncHandler(async (req, res) => {
  const result = await service.holdSeats(req.params.id, req.body, req.user);
  sendResponse(res, { statusCode: 201, message: 'Seats held temporarily', data: result });
});
export const releaseSeats = asyncHandler(async (req, res) => {
  const result = await service.releaseSeats(req.params.id, req.body, req.user);
  sendResponse(res, { message: 'Seats released', data: result });
});
