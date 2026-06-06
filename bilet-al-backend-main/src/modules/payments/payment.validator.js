import { z } from 'zod';
import { idParam, objectId, paginationQuery } from '../../validations/common.js';
import { PAYMENT_METHOD, PAYMENT_PROVIDER } from '../../utils/constants.js';

export const checkoutSchema = z.object({
  body: z.object({
    bookingId: objectId.optional(),
    booking: objectId.optional(),
    provider: z.nativeEnum(PAYMENT_PROVIDER).optional(),
    method: z.nativeEnum(PAYMENT_METHOD).optional(),
    paymentType: z.enum(['CASH', 'CARD', 'COMPLIMENTARY']).optional(),
    source: z.string().optional(),
    complimentary: z.coerce.boolean().optional(),
    amount: z.coerce.number().min(0).optional(),
    customerInfo: z.object({ fullName: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional() }).optional(),
    cardToken: z.string().optional(),
    success: z.boolean().optional(),
    returnUrl: z.string().url().optional(),
    callbackUrl: z.string().url().optional()
  }).refine((body) => body.bookingId || body.booking, { message: 'bookingId or booking is required', path: ['bookingId'] }).transform((body) => ({
    ...body,
    bookingId: body.bookingId || body.booking,
    complimentary: body.complimentary || body.paymentType === 'COMPLIMENTARY',
    provider: body.provider || (body.paymentType === 'CASH' || body.paymentType === 'COMPLIMENTARY' ? PAYMENT_PROVIDER.CASH : PAYMENT_PROVIDER.MOCK),
    method: body.method || (body.paymentType === 'CASH' || body.paymentType === 'COMPLIMENTARY' ? PAYMENT_METHOD.CASH : PAYMENT_METHOD.CARD)
  }))
});
export const callbackSchema = z.object({ body: z.record(z.any()) });
export const idSchema = z.object({ params: idParam });
export const listPaymentsSchema = z.object({
  query: paginationQuery.extend({
    provider: z.string().optional(),
    method: z.string().optional(),
    user: objectId.optional(),
    booking: objectId.optional(),
    bookingId: objectId.optional()
  }).transform((query) => ({ ...query, booking: query.booking || query.bookingId }))
});
