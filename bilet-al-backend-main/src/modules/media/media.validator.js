import { z } from 'zod';
import { idParam, objectId, paginationQuery } from '../../validations/common.js';
export const listMediaSchema = z.object({ query: paginationQuery.extend({ module: z.string().optional(), mimetype: z.string().optional() }) });
export const idSchema = z.object({ params: idParam });
export const eventMediaSchema = z.object({ params: z.object({ eventId: objectId }) });
