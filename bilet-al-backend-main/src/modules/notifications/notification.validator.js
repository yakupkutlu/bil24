import { z } from 'zod';
import { idParam, objectId, paginationQuery } from '../../validations/common.js';

export const listNotificationsSchema = z.object({ query: paginationQuery });
export const idSchema = z.object({ params: idParam });
export const campaignSchema = z.object({ body: z.object({ userIds: z.array(objectId).optional(), role: z.string().optional(), type: z.enum(['EMAIL', 'SMS', 'SYSTEM']).default('SYSTEM'), title: z.string().min(2), message: z.string().min(2), channel: z.string().optional() }) });
