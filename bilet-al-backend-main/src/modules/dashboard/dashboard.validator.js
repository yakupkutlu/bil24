import { z } from 'zod';
export const dashboardQuerySchema = z.object({ query: z.object({}).passthrough() });
