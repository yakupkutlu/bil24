import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';

export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let details = error.details || null;

  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource id';
  }
  if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate value';
    details = error.keyValue;
  }
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (statusCode >= 500) {
    logger.error(message, { stack: error.stack, path: req.originalUrl });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(!isProduction ? { stack: error.stack } : {})
  });
}
