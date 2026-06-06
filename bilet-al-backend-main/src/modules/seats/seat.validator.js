import { z } from 'zod';
import { idParam } from '../../validations/common.js';

export const showtimeSeatsSchema = z.object({ params: idParam });
export const holdSeatsSchema = z.object({
  params: idParam,
  body: z.object({
    seatCodes: z.array(z.string().trim().min(1)).min(1).max(10),
    sessionId: z.string().trim().max(120).optional()
  })
});
export const releaseSeatsSchema = holdSeatsSchema;
