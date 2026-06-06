import { z } from 'zod';

const password = z.string().min(8).max(128).regex(/[A-Z]/, 'Password must contain uppercase letter').regex(/[a-z]/, 'Password must contain lowercase letter').regex(/[0-9]/, 'Password must contain number');

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(5).max(30).optional(),
    password,
    preferences: z.object({
      language: z.enum(['tr', 'en', 'ar']).optional(),
      marketingPermission: z.boolean().optional()
    }).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email: z.string().trim().email().toLowerCase() })
});

export const resetPasswordSchema = z.object({
  body: z.object({ token: z.string().min(20), password })
});

export const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(20) })
});
