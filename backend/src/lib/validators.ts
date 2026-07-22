import { z } from 'zod';

/** Account email (used for sign-in). */
export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

/** Account password. Min 6 to satisfy Supabase's default password policy. */
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password is too long');

/**
 * Optional E.164-style phone, e.g. +919000000000.
 * Stored on the profile for now; used when phone + OTP sign-in is added later.
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number in international format');

export const uuidSchema = z.string().uuid('Invalid id');

export const idParam = z.object({ id: uuidSchema });

/** Common list pagination. */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type Pagination = z.infer<typeof paginationSchema>;
