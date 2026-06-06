import { z } from 'zod';
import { idParam, objectId, paginationQuery } from '../../validations/common.js';
import { SHOWTIME_STATUS } from '../../utils/constants.js';

const pricingSchema = z.object({
  VIP: z.coerce.number().min(0),
  STANDARD: z.coerce.number().min(0),
  STUDENT: z.coerce.number().min(0)
});

const showtimeFields = z.object({
  event: objectId.optional(),
  eventId: objectId.optional(),
  hall: objectId.optional(),
  hallId: objectId.optional(),
  date: z.coerce.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  status: z.nativeEnum(SHOWTIME_STATUS).optional(),
  pricing: pricingSchema,
  availableFrom: z.coerce.date().optional(),
  availableUntil: z.coerce.date().optional(),
  cancellationPolicy: z.string().optional()
});

function normalizeShowtimeBody(body) {
  return { ...body, event: body.event || body.eventId, hall: body.hall || body.hallId };
}

export const listShowtimesSchema = z.object({ query: paginationQuery.extend({ event: objectId.optional(), eventId: objectId.optional(), hall: objectId.optional(), hallId: objectId.optional(), dateFrom: z.coerce.date().optional(), dateTo: z.coerce.date().optional(), status: z.nativeEnum(SHOWTIME_STATUS).optional() }).transform((query) => ({ ...query, event: query.event || query.eventId, hall: query.hall || query.hallId })) });
export const idSchema = z.object({ params: idParam });
export const eventShowtimesSchema = z.object({ params: z.object({ eventId: objectId }), query: paginationQuery });
export const createShowtimeSchema = z.object({ body: showtimeFields.refine((body) => body.event || body.eventId, { message: 'event or eventId is required', path: ['event'] }).refine((body) => body.hall || body.hallId, { message: 'hall or hallId is required', path: ['hall'] }).transform(normalizeShowtimeBody) });
export const updateShowtimeSchema = z.object({ params: idParam, body: showtimeFields.partial().transform(normalizeShowtimeBody) });
export const statusSchema = z.object({ params: idParam, body: z.object({ status: z.nativeEnum(SHOWTIME_STATUS) }) });
