import { z } from 'zod';
import { idParam, objectId, paginationQuery } from '../../validations/common.js';

export const listTicketsSchema = z.object({
  query: paginationQuery.extend({
    showtime: objectId.optional(),
    showtimeId: objectId.optional(),
    booking: objectId.optional(),
    bookingId: objectId.optional(),
    user: objectId.optional()
  }).transform((query) => ({
    ...query,
    showtime: query.showtime || query.showtimeId,
    booking: query.booking || query.bookingId
  }))
});
export const idSchema = z.object({ params: idParam });
export const verifySchema = z.object({ body: z.object({ qrToken: z.string().min(10), markUsed: z.boolean().optional() }) });
export const qrParamSchema = z.object({ params: z.object({ qrToken: z.string().min(10) }) });
