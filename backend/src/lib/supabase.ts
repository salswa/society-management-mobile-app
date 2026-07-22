import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { env } from '../config/env';

/**
 * Public client — uses the new-style publishable key (sb_publishable_...).
 * Safe for public contexts. We use it to verify a caller's access token
 * via `supabasePublic.auth.getUser(jwt)`.
 */
export const supabasePublic = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_PUBLISHABLE_KEY
);

/**
 * Admin client — uses the new-style secret key (sb_secret_...).
 * Elevated access; server-only. Used for all privileged DB writes and
 * `auth.admin.*` operations (creating users, confirming phone, etc.).
 */
export const supabaseAdmin = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
