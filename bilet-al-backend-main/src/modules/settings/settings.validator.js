import { z } from 'zod';

const themeSchema = z.object({
  primary: z.string().optional(),
  accent: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  mode: z.enum(['dark', 'light']).optional()
}).transform((theme) => ({
  ...theme,
  primaryColor: theme.primaryColor || theme.primary,
  accentColor: theme.accentColor || theme.accent
}));

const ticketRulesSchema = z.object({
  seatHoldMinutes: z.coerce.number().min(1).optional(),
  cancellationDeadlineHours: z.coerce.number().min(0).optional(),
  refundAllowed: z.coerce.boolean().optional(),
  serviceFee: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional()
}).transform((rules) => ({
  ...rules,
  taxRate: typeof rules.taxRate === 'number' && rules.taxRate > 1 ? rules.taxRate / 100 : rules.taxRate
}));

export const updateSettingsSchema = z.object({ body: z.object({
  websiteName: z.string().optional(), logo: z.string().optional(),
  theme: themeSchema.optional(),
  paymentSettings: z.object({ defaultProvider: z.string().optional(), currency: z.string().optional(), iyzicoEnabled: z.coerce.boolean().optional(), cashEnabled: z.coerce.boolean().optional() }).optional(),
  emailSettings: z.object({ enabled: z.coerce.boolean().optional(), senderName: z.string().optional() }).optional(),
  smsSettings: z.object({ enabled: z.coerce.boolean().optional(), provider: z.string().optional() }).optional(),
  ticketRules: ticketRulesSchema.optional(),
  maintenanceMode: z.coerce.boolean().optional()
}) });
