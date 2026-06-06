import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    phone: z.string().trim().max(30).optional(),
    avatar: z.string().trim().optional(),
    birthDate: z.coerce.date().optional()
  }).strict()
});

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/)
  })
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    language: z.enum(['tr', 'en', 'ar']).optional(),
    favoriteCategories: z.array(z.string().trim()).optional(),
    emailNotifications: z.coerce.boolean().optional(),
    smsNotifications: z.coerce.boolean().optional(),
    marketingPermission: z.coerce.boolean().optional()
  }).strict()
});
