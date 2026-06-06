import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './user.service.js';

export const listUsers = asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  sendResponse(res, { data: { items: result.items, users: result.items }, meta: result.meta });
});
export const getUser = asyncHandler(async (req, res) => {
  const user = await service.getById(req.params.id);
  sendResponse(res, { data: { item: user, user } });
});
export const updateUser = asyncHandler(async (req, res) => {
  const user = await service.update(req.params.id, req.body);
  await writeAuditLog({ req, action: 'UPDATE_USER', module: 'users', entityId: user._id, newValue: req.body });
  sendResponse(res, { message: 'User updated', data: { item: user, user } });
});
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await service.softDelete(req.params.id);
  await writeAuditLog({ req, action: 'DELETE_USER', module: 'users', entityId: user._id });
  sendResponse(res, { message: 'User deleted', data: { item: user, user } });
});
export const changeStatus = asyncHandler(async (req, res) => {
  const user = await service.changeStatus(req.params.id, req.body.status);
  await writeAuditLog({ req, action: 'CHANGE_USER_STATUS', module: 'users', entityId: user._id, newValue: { status: req.body.status } });
  sendResponse(res, { message: 'User status updated', data: { item: user, user } });
});
export const changeRole = asyncHandler(async (req, res) => {
  const user = await service.changeRole(req.params.id, req.body.role);
  await writeAuditLog({ req, action: 'CHANGE_USER_ROLE', module: 'users', entityId: user._id, newValue: { role: req.body.role } });
  sendResponse(res, { message: 'User role updated', data: { item: user, user } });
});
