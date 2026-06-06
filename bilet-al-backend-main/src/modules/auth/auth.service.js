import dayjs from 'dayjs';
import User from '../users/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { createOpaqueToken, hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/token.js';
import { sendEmail } from '../../utils/email.js';
import { ROLES, USER_STATUS } from '../../utils/constants.js';

function refreshExpiresAt() {
  return dayjs().add(30, 'day').toDate();
}

function sanitizeUser(user) {
  const obj = user.toJSON ? user.toJSON() : user;
  delete obj.passwordHash;
  delete obj.refreshTokens;
  return obj;
}

async function issueTokenPair(user, req) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, jti } = signRefreshToken(user);
  user.refreshTokens = (user.refreshTokens || []).filter((entry) => !entry.revokedAt && entry.expiresAt > new Date()).slice(-4);
  user.refreshTokens.push({
    tokenHash: hashToken(refreshToken),
    jti,
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
    expiresAt: refreshExpiresAt()
  });
  user.lastLoginAt = new Date();
  await user.save();
  return { accessToken, refreshToken };
}

export async function register(payload, req) {
  const existing = await User.findOne({ email: payload.email }).select('_id');
  if (existing) throw new ApiError(409, 'Email already registered');

  const verificationToken = createOpaqueToken(32);
  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone || '',
    passwordHash: await hashPassword(payload.password),
    role: ROLES.CUSTOMER,
    preferences: {
      language: payload.preferences?.language || 'tr',
      marketingPermission: Boolean(payload.preferences?.marketingPermission)
    },
    emailVerificationTokenHash: hashToken(verificationToken),
    emailVerificationExpiresAt: dayjs().add(24, 'hour').toDate()
  });

  await sendEmail({
    to: user.email,
    subject: 'Verify your Tiatru email',
    text: `Use this verification token in development: ${verificationToken}`
  });

  const tokens = await issueTokenPair(await User.findById(user._id).select('+refreshTokens'), req);
  return { user: sanitizeUser(user), ...tokens, verificationToken };
}

export async function login({ email, password }, req) {
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');
  if (!user || user.status !== USER_STATUS.ACTIVE) throw new ApiError(401, 'Invalid credentials');
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');
  const tokens = await issueTokenPair(user, req);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refresh(refreshToken, req) {
  if (!refreshToken) throw new ApiError(401, 'Refresh token is missing');
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_) {
    throw new ApiError(401, 'Invalid refresh token');
  }
  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || user.status !== USER_STATUS.ACTIVE) throw new ApiError(401, 'User is not active');
  const currentHash = hashToken(refreshToken);
  const stored = (user.refreshTokens || []).find((entry) => entry.tokenHash === currentHash && !entry.revokedAt && entry.expiresAt > new Date());
  if (!stored) throw new ApiError(401, 'Refresh token was revoked or expired');
  stored.revokedAt = new Date();
  const tokens = await issueTokenPair(user, req);
  return { user: sanitizeUser(user), ...tokens };
}

export async function logout(refreshToken, reqUser) {
  if (!refreshToken || !reqUser) return;
  const user = await User.findById(reqUser._id).select('+refreshTokens');
  if (!user) return;
  const currentHash = hashToken(refreshToken);
  user.refreshTokens = (user.refreshTokens || []).map((entry) => entry.tokenHash === currentHash ? { ...(entry.toObject?.() ?? entry), revokedAt: new Date() } : entry);
  await user.save();
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  if (!user) return { sent: true };
  const resetToken = createOpaqueToken(32);
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpiresAt = dayjs().add(20, 'minute').toDate();
  await user.save();
  await sendEmail({ to: user.email, subject: 'Tiatru password reset', text: `Use this reset token in development: ${resetToken}` });
  return { sent: true, resetToken };
}

export async function resetPassword({ token, password }) {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() }
  }).select('+passwordHash +passwordResetTokenHash +passwordResetExpiresAt +refreshTokens');
  if (!user) throw new ApiError(400, 'Invalid or expired reset token');
  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.refreshTokens = [];
  await user.save();
  return { changed: true };
}

export async function verifyEmail({ token }) {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() }
  }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
  if (!user) throw new ApiError(400, 'Invalid or expired verification token');
  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  return { verified: true };
}
