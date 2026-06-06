import { z } from 'zod';
import { idParam, objectId, paginationQuery } from '../../validations/common.js';
import { BOOKING_SOURCE } from '../../utils/constants.js';

const customerSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(40).optional()
}).partial();

export const createBookingSchema = z.object({
  body: z.object({
    showtime: objectId.optional(),
    showtimeId: objectId.optional(),
    seatCodes: z.array(z.string().trim().min(1)).min(1).max(10),
    sessionId: z.string().trim().max(120).optional(),
    source: z.nativeEnum(BOOKING_SOURCE).optional(),
    customer: customerSchema.optional(),
    customerInfo: customerSchema.optional(),
    discount: z.coerce.number().min(0).optional(),
    paymentType: z.enum(['CASH', 'CARD', 'COMPLIMENTARY']).optional(),
    complimentary: z.coerce.boolean().optional()
  }).refine((body) => body.showtime || body.showtimeId, {
    message: 'showtime or showtimeId is required',
    path: ['showtimeId']
  }).transform((body) => ({
    ...body,
    showtime: body.showtime || body.showtimeId,
    customer: body.customer || body.customerInfo
  }))
});

export const listBookingsSchema = z.object({
  query: paginationQuery.extend({
    user: objectId.optional(),
    showtime: objectId.optional(),
    showtimeId: objectId.optional(),
    source: z.string().optional(),
    bookingNumber: z.string().optional()
  }).transform((query) => ({ ...query, showtime: query.showtime || query.showtimeId }))
});
export const idSchema = z.object({ params: idParam });
export const cancelSchema = z.object({ params: idParam, body: z.object({ reason: z.string().optional() }).optional().default({}) });
