import { env } from '../../config/env.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { cookieOptions } from '../../utils/token.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as authService from './auth.service.js';

function setRefreshCookie(res, refreshToken) {
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(env.REFRESH_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body, req);
  setRefreshCookie(res, result.refreshToken);
  sendResponse(res, { statusCode: 201, message: 'Registered successfully', data: { user: result.user, accessToken: result.accessToken, devVerificationToken: result.verificationToken } });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, req);
  setRefreshCookie(res, result.refreshToken);
  sendResponse(res, { message: 'Logged in successfully', data: { user: result.user, accessToken: result.accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.cookies?.[env.REFRESH_COOKIE_NAME], req);
  setRefreshCookie(res, result.refreshToken);
  sendResponse(res, { message: 'Token refreshed', data: { user: result.user, accessToken: result.accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[env.REFRESH_COOKIE_NAME], req.user);
  clearRefreshCookie(res);
  sendResponse(res, { message: 'Logged out successfully' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  sendResponse(res, { message: 'Password reset email sent if the account exists', data: { devResetToken: result.resetToken } });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  sendResponse(res, { message: 'Password changed successfully' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.body);
  sendResponse(res, { message: 'Email verified successfully' });
});
