import { z } from 'zod';

/** Account email (used for sign-in). */
export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

/** Account password. Min 6 to satisfy Supabase's default password policy. */
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password is too long');

/** 10-digit phone number (India). Stored on the profile; used later for phone + OTP. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'Enter a valid 10-digit phone number');

export const uuidSchema = z.string().uuid('Invalid id');

export const idParam = z.object({ id: uuidSchema });

/** Common list pagination. */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type Pagination = z.infer<typeof paginationSchema>;
