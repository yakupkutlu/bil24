import User from '../modules/users/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/token.js';
import { USER_STATUS } from '../utils/constants.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await User.findById(payload.sub).select('+passwordHash +refreshTokens');
  if (!user || user.status !== USER_STATUS.ACTIVE) throw new ApiError(401, 'User is not active');
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.status === USER_STATUS.ACTIVE) req.user = user;
  } catch (_) {
    // Ignore optional auth failures.
  }
  next();
});
