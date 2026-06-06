import { ApiError } from '../utils/ApiError.js';

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission for this action'));
  return next();
};

export const authorizeSelfOr = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (roles.includes(req.user.role) || req.params.id === req.user._id.toString()) return next();
  return next(new ApiError(403, 'You can only access your own resource'));
};
