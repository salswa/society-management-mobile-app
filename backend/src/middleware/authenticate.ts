import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin, supabasePublic } from '../lib/supabase';
import { forbidden, unauthorized } from '../lib/errors';

/**
 * Verifies the Bearer access token with Supabase, loads the caller's profile,
 * and attaches `req.auth`. Rejects disabled accounts.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Missing Bearer token');
    }

    const { data, error } = await supabasePublic.auth.getUser(token);
    if (error || !data.user) {
      throw unauthorized('Invalid or expired token');
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw unauthorized('Profile not found for this account');
    }

    if (profile.status === 'disabled') {
      throw forbidden('This account has been disabled');
    }

    req.auth = { userId: data.user.id, token, profile };
    next();
  } catch (err) {
    next(err);
  }
}
