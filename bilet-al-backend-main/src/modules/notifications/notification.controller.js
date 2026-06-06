import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './notification.service.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await service.list(req.query, req.user);
  sendResponse(res, { data: result.items, meta: result.meta });
});
export const markRead = asyncHandler(async (req, res) => {
  const notification = await service.markRead(req.params.id, req.user);
  { const payload = notification?.toJSON?.() ?? notification; sendResponse(res, { message: 'Notification marked as read', data: { ...payload, item: payload, notification: payload } }); }
});
export const campaign = asyncHandler(async (req, res) => {
  const notifications = await service.createCampaign(req.body, req.user);
  await writeAuditLog({ req, action: 'CREATE_NOTIFICATION_CAMPAIGN', module: 'notifications', newValue: req.body });
  sendResponse(res, { statusCode: 201, message: 'Campaign created', data: { count: notifications.length, items: notifications, notifications } });
});
