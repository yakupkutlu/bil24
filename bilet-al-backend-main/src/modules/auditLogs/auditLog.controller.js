import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as service from './auditLog.service.js';
export const listAuditLogs = asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  sendResponse(res, { data: { items: result.items, auditLogs: result.items }, meta: result.meta });
});
export const getAuditLog = asyncHandler(async (req, res) => {
  const auditLog = await service.get(req.params.id);
  sendResponse(res, { data: { item: auditLog, auditLog } });
});
