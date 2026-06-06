import { z } from 'zod';
export const reportQuerySchema = z.object({ query: z.object({ dateFrom: z.coerce.date().optional(), dateTo: z.coerce.date().optional(), event: z.string().optional(), hall: z.string().optional(), format: z.enum(['json', 'csv', 'pdf', 'excel']).optional() }).passthrough() });
