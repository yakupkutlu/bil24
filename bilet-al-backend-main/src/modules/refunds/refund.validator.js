import { z } from 'zod';
import { idParam, objectId, paginationQuery } from '../../validations/common.js';
import { REFUND_STATUS } from '../../utils/constants.js';

export const createRefundSchema = z.object({ body: z.object({ bookingId: objectId.optional(), booking: objectId.optional(), reason: z.string().trim().min(5), amount: z.coerce.number().positive().optional() }).refine((body) => body.bookingId || body.booking, { message: 'bookingId or booking is required', path: ['bookingId'] }).transform((body) => ({ ...body, bookingId: body.bookingId || body.booking })) });
export const listRefundsSchema = z.object({ query: paginationQuery.extend({ user: objectId.optional(), booking: objectId.optional(), bookingId: objectId.optional(), status: z.nativeEnum(REFUND_STATUS).optional() }).transform((query) => ({ ...query, booking: query.booking || query.bookingId })) });
export const idSchema = z.object({ params: idParam });
export const rejectSchema = z.object({ params: idParam, body: z.object({ reason: z.string().trim().min(3).optional() }).optional().default({}) });
