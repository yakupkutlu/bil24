import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './settings.service.js';

function serializeSettings(settings) {
  const obj = settings?.toJSON?.() ?? settings?.toObject?.() ?? settings;
  const theme = { ...(obj.theme ?? {}) };
  theme.primary = theme.primary ?? theme.primaryColor ?? '#7A0C0C';
  theme.accent = theme.accent ?? theme.accentColor ?? '#B8860B';
  theme.primaryColor = theme.primaryColor ?? theme.primary;
  theme.accentColor = theme.accentColor ?? theme.accent;
  return { ...obj, theme };
}

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await service.getSettings();
  { const payload = serializeSettings(settings); sendResponse(res, { data: { ...payload, item: payload, settings: payload } }); }
});
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await service.updateSettings(req.body, req.user);
  await writeAuditLog({ req, action: 'UPDATE_SETTINGS', module: 'settings', entityId: settings._id, newValue: req.body });
  { const payload = serializeSettings(settings); sendResponse(res, { message: 'Settings updated', data: { ...payload, item: payload, settings: payload } }); }
});
