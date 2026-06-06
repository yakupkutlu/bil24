import mongoose from 'mongoose';
import validator from 'validator';
import { ROLES, USER_STATUS } from '../../utils/constants.js';

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, index: true },
  jti: { type: String, required: true },
  userAgent: String,
  ipAddress: String,
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid email address']
  },
  phone: { type: String, trim: true, default: '' },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
  avatar: { type: String, default: '' },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE, index: true },
  preferences: {
    language: { type: String, enum: ['tr', 'en', 'ar'], default: 'tr' },
    favoriteCategories: [{ type: String, trim: true }],
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    marketingPermission: { type: Boolean, default: false }
  },
  birthDate: Date,
  refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  emailVerificationTokenHash: { type: String, select: false },
  emailVerificationExpiresAt: { type: Date, select: false },
  lastLoginAt: Date
}, { timestamps: true });

userSchema.index({ fullName: 'text', email: 'text', phone: 'text' });

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokens;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpiresAt;
  delete obj.emailVerificationTokenHash;
  delete obj.emailVerificationExpiresAt;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
