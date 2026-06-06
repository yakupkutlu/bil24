import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as service from './profile.service.js';

function serializeUser(user) {
  return user?.toJSON?.() ?? user?.toObject?.() ?? user;
}

export const getProfile = asyncHandler(async (req, res) => {
  const user = serializeUser(await service.getProfile(req.user._id));
  sendResponse(res, { data: { ...user, item: user, user } });
});
export const updateProfile = asyncHandler(async (req, res) => {
  const user = serializeUser(await service.updateProfile(req.user._id, req.body));
  sendResponse(res, { message: 'Profile updated', data: { ...user, item: user, user } });
});
export const updatePassword = asyncHandler(async (req, res) => { await service.updatePassword(req.user._id, req.body); sendResponse(res, { message: 'Password updated. Please login again.' }); });
export const updatePreferences = asyncHandler(async (req, res) => {
  const user = serializeUser(await service.updatePreferences(req.user._id, req.body));
  sendResponse(res, { message: 'Preferences updated', data: { ...user, item: user, user } });
});
