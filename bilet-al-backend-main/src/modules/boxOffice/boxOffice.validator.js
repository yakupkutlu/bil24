import { z } from 'zod';
import { objectId } from '../../validations/common.js';

const customerInfoSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(40).optional()
}).partial();

export const sellTicketSchema = z.object({
  body: z.object({
    showtimeId: objectId.optional(),
    showtime: objectId.optional(),
    seatCodes: z.array(z.string().trim().min(1)).min(1).max(10),
    customerInfo: customerInfoSchema.optional(),
    customer: customerInfoSchema.optional(),
    paymentType: z.enum(['CASH', 'CARD', 'COMPLIMENTARY']).default('CASH'),
    discount: z.coerce.number().min(0).optional(),
    success: z.boolean().optional()
  }).refine((body) => body.showtimeId || body.showtime, {
    message: 'showtimeId or showtime is required',
    path: ['showtimeId']
  }).transform((body) => ({
    ...body,
    showtime: body.showtime || body.showtimeId,
    customer: body.customer || body.customerInfo
  }))
});
