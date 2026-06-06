import { z } from 'zod';
import { idParam, paginationQuery } from '../../validations/common.js';
import { HALL_STATUS, SEAT_CATEGORY } from '../../utils/constants.js';

const seatSchema = z.object({
  row: z.string().min(1),
  number: z.number().int().positive(),
  code: z.string().min(1),
  category: z.nativeEnum(SEAT_CATEGORY).optional(),
  isAccessible: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  position: z.object({ x: z.number().optional(), y: z.number().optional() }).optional()
});

const hallBody = z.object({
  name: z.string().trim().min(2),
  description: z.string().optional(),
  capacity: z.number().int().positive(),
  rows: z.number().int().positive(),
  seatsPerRow: z.number().int().positive(),
  seatMap: z.array(seatSchema).optional(),
  status: z.nativeEnum(HALL_STATUS).optional()
});

export const listHallsSchema = z.object({ query: paginationQuery });
export const idSchema = z.object({ params: idParam });
export const createHallSchema = z.object({ body: hallBody });
export const updateHallSchema = z.object({ params: idParam, body: hallBody.partial() });
export const generateSeatsSchema = z.object({ params: idParam, body: z.object({ rows: z.number().int().positive().optional(), seatsPerRow: z.number().int().positive().optional(), defaultCategory: z.nativeEnum(SEAT_CATEGORY).optional() }).optional().default({}) });
export const updateSeatsSchema = z.object({
  params: idParam,
  body: z.object({
    seatMap: z.array(seatSchema).min(1).optional(),
    seats: z.array(seatSchema).min(1).optional()
  }).refine((body) => body.seatMap || body.seats, {
    message: 'seatMap or seats is required',
    path: ['seatMap']
  }).transform((body) => ({ ...body, seatMap: body.seatMap || body.seats }))
});
