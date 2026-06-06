import { z } from 'zod';
import { idParam, paginationQuery } from '../../validations/common.js';
import { ROLES, USER_STATUS } from '../../utils/constants.js';

export const listUsersSchema = z.object({ query: paginationQuery.extend({ role: z.nativeEnum(ROLES).optional() }) });
export const idSchema = z.object({ params: idParam });

export const updateUserSchema = z.object({
  params: idParam,
  body: z.object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    avatar: z.string().trim().optional(),
    preferences: z.object({
      language: z.enum(['tr', 'en', 'ar']).optional(),
      favoriteCategories: z.array(z.string()).optional(),
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      marketingPermission: z.boolean().optional()
    }).optional()
  }).strict()
});

export const statusSchema = z.object({ params: idParam, body: z.object({ status: z.nativeEnum(USER_STATUS) }) });
export const roleSchema = z.object({ params: idParam, body: z.object({ role: z.nativeEnum(ROLES) }) });
