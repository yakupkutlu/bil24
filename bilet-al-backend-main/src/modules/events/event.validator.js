import { z } from 'zod';
import { idParam, paginationQuery } from '../../validations/common.js';
import { EVENT_STATUS } from '../../utils/constants.js';

const castSchema = z.object({ name: z.string().min(1), role: z.string().optional(), image: z.string().optional() });

function normalizeLanguage(value) {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (['tr', 'turkish', 'türkçe', 'turkce'].includes(normalized)) return 'tr';
  if (['en', 'english', 'ingilizce'].includes(normalized)) return 'en';
  if (['ar', 'arabic', 'arapça', 'arapca'].includes(normalized)) return 'ar';
  return 'other';
}

function parseAgeLimit(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

const eventBody = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(220).optional(),
  description: z.string().trim().min(10),
  shortDescription: z.string().trim().optional(),
  posterImage: z.string().trim().optional(),
  gallery: z.array(z.string()).optional(),
  trailerUrl: z.string().trim().optional(),
  category: z.string().trim().min(2),
  language: z.preprocess(normalizeLanguage, z.enum(['tr', 'en', 'ar', 'other']).optional()),
  durationMinutes: z.coerce.number().int().positive(),
  ageLimit: z.preprocess(parseAgeLimit, z.coerce.number().int().min(0).optional()),
  cast: z.array(castSchema).optional(),
  director: z.string().trim().optional(),
  status: z.nativeEnum(EVENT_STATUS).optional(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional(), keywords: z.array(z.string()).optional() }).optional()
});

export const listEventsSchema = z.object({ query: paginationQuery.extend({ category: z.string().optional(), language: z.string().optional(), status: z.nativeEnum(EVENT_STATUS).optional() }) });
export const slugSchema = z.object({ params: z.object({ slug: z.string().min(1) }) });
export const createEventSchema = z.object({ body: eventBody });
export const updateEventSchema = z.object({ params: idParam, body: eventBody.partial() });
export const idSchema = z.object({ params: idParam });
export const statusSchema = z.object({ params: idParam, body: z.object({ status: z.nativeEnum(EVENT_STATUS) }) });
