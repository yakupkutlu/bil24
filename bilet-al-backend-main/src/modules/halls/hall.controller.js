import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './hall.service.js';

export const listHalls = asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  sendResponse(res, { data: { items: result.items, halls: result.items }, meta: result.meta });
});
export const getHall = asyncHandler(async (req, res) => {
  const hall = await service.get(req.params.id);
  sendResponse(res, { data: { item: hall, hall } });
});
export const createHall = asyncHandler(async (req, res) => {
  const hall = await service.create(req.body);
  await writeAuditLog({ req, action: 'CREATE_HALL', module: 'halls', entityId: hall._id, newValue: req.body });
  sendResponse(res, { statusCode: 201, message: 'Hall created', data: { item: hall, hall } });
});
export const updateHall = asyncHandler(async (req, res) => {
  const hall = await service.update(req.params.id, req.body);
  await writeAuditLog({ req, action: 'UPDATE_HALL', module: 'halls', entityId: hall._id, newValue: req.body });
  sendResponse(res, { message: 'Hall updated', data: { item: hall, hall } });
});
export const deleteHall = asyncHandler(async (req, res) => {
  const hall = await service.remove(req.params.id);
  await writeAuditLog({ req, action: 'DELETE_HALL', module: 'halls', entityId: hall._id });
  sendResponse(res, { message: 'Hall deleted', data: { item: hall, hall } });
});
export const generateSeats = asyncHandler(async (req, res) => {
  const hall = await service.generateSeats(req.params.id, req.body);
  await writeAuditLog({ req, action: 'GENERATE_SEATS', module: 'halls', entityId: hall._id, newValue: req.body });
  sendResponse(res, { message: 'Seats generated', data: { item: hall, hall } });
});
export const updateSeats = asyncHandler(async (req, res) => {
  const hall = await service.updateSeats(req.params.id, req.body.seatMap || req.body.seats);
  await writeAuditLog({ req, action: 'UPDATE_SEATS', module: 'halls', entityId: hall._id });
  sendResponse(res, { message: 'Seats updated', data: { item: hall, hall } });
});
