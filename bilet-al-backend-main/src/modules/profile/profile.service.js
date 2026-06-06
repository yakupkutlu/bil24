import User from '../users/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { comparePassword, hashPassword } from '../../utils/password.js';

export async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Profile not found');
  return user;
}

export async function updateProfile(userId, payload) {
  const user = await User.findByIdAndUpdate(userId, payload, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'Profile not found');
  return user;
}

export async function updatePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash +refreshTokens');
  if (!user) throw new ApiError(404, 'Profile not found');
  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw new ApiError(400, 'Current password is wrong');
  user.passwordHash = await hashPassword(newPassword);
  user.refreshTokens = [];
  await user.save();
  return { changed: true };
}

export async function updatePreferences(userId, payload) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Profile not found');
  user.preferences = { ...(user.preferences?.toObject?.() ?? user.preferences ?? {}), ...payload };
  await user.save();
  return user;
}
