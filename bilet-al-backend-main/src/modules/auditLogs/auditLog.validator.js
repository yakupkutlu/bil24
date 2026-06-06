import { z } from 'zod';
import { idParam, paginationQuery } from '../../validations/common.js';
export const listAuditLogsSchema = z.object({ query: paginationQuery.extend({ module: z.string().optional(), action: z.string().optional() }) });
export const idSchema = z.object({ params: idParam });
