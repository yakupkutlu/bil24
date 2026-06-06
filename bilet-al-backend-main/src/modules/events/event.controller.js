import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './event.service.js';

export const listEvents = asyncHandler(async (req, res) => {
  const result = await service.list(req.query, req.user);
  sendResponse(res, { data: { items: result.items, events: result.items }, meta: result.meta });
});
export const getEvent = asyncHandler(async (req, res) => {
  const event = await service.getBySlug(req.params.slug, req.user);
  sendResponse(res, { data: { item: event, event } });
});
export const createEvent = asyncHandler(async (req, res) => {
  const event = await service.create(req.body, req.user);
  await writeAuditLog({ req, action: 'CREATE_EVENT', module: 'events', entityId: event._id, newValue: req.body });
  sendResponse(res, { statusCode: 201, message: 'Event created', data: { item: event, event } });
});
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await service.update(req.params.id, req.body, req.user);
  await writeAuditLog({ req, action: 'UPDATE_EVENT', module: 'events', entityId: event._id, newValue: req.body });
  sendResponse(res, { message: 'Event updated', data: { item: event, event } });
});
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await service.remove(req.params.id);
  await writeAuditLog({ req, action: 'DELETE_EVENT', module: 'events', entityId: event._id });
  sendResponse(res, { message: 'Event deleted', data: { item: event, event } });
});
export const changeStatus = asyncHandler(async (req, res) => {
  const event = await service.changeStatus(req.params.id, req.body.status, req.user);
  await writeAuditLog({ req, action: 'CHANGE_EVENT_STATUS', module: 'events', entityId: event._id, newValue: { status: req.body.status } });
  sendResponse(res, { message: 'Event status updated', data: { item: event, event } });
});
