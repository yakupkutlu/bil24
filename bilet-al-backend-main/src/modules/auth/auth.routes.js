import { Router } from 'express';
import validate from '../../middlewares/validate.middleware.js';
import { authLimiter } from '../../middlewares/rateLimit.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import * as controller from './auth.controller.js';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from './auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/refresh', authLimiter, controller.refresh);
router.post('/logout', protect, controller.logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), controller.resetPassword);
router.post('/verify-email', validate(verifyEmailSchema), controller.verifyEmail);

export default router;
