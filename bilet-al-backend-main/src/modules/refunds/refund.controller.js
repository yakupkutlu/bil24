import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './refund.service.js';

export const createRefund = asyncHandler(async (req, res) => {
  const refund = await service.createRefund(req.body, req.user);
  await writeAuditLog({ req, action: 'CREATE_REFUND', module: 'refunds', entityId: refund._id, newValue: req.body });
  sendResponse(res, { statusCode: 201, message: 'Refund requested', data: { item: refund, refund } });
});
export const listRefunds = asyncHandler(async (req, res) => {
  const result = await service.list(req.query, req.user);
  sendResponse(res, { data: { items: result.items, refunds: result.items }, meta: result.meta });
});
export const getRefund = asyncHandler(async (req, res) => {
  const refund = await service.get(req.params.id, req.user);
  sendResponse(res, { data: { item: refund, refund } });
});
export const approveRefund = asyncHandler(async (req, res) => {
  const refund = await service.approve(req.params.id, req.user);
  await writeAuditLog({ req, action: 'APPROVE_REFUND', module: 'refunds', entityId: refund._id });
  sendResponse(res, { message: 'Refund approved', data: { item: refund, refund } });
});
export const rejectRefund = asyncHandler(async (req, res) => {
  const refund = await service.reject(req.params.id, req.user, req.body.reason);
  await writeAuditLog({ req, action: 'REJECT_REFUND', module: 'refunds', entityId: refund._id });
  sendResponse(res, { message: 'Refund rejected', data: { item: refund, refund } });
});
export const processRefund = asyncHandler(async (req, res) => {
  const refund = await service.process(req.params.id, req.user);
  await writeAuditLog({ req, action: 'PROCESS_REFUND', module: 'refunds', entityId: refund._id });
  sendResponse(res, { message: 'Refund processed', data: { item: refund, refund } });
});
