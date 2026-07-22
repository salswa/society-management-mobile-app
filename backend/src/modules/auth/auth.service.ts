import { supabaseAdmin, supabasePublic } from '../../lib/supabase';
import { AppError, conflict, unauthorized } from '../../lib/errors';
import { unwrap } from '../../lib/db';
import type { Profile, UserRole } from '../../types/database.types';

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  society_id?: string;
};

type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number | undefined;
};

/**
 * Registers a self-service user (always role=resident, status=pending until an
 * admin approves + assigns a flat). Creates an email-confirmed Supabase auth user
 * with the secret key (no verification email), then the profile row, then logs
 * them in. Phone is stored for later (phone + OTP sign-in).
 */
export async function register(input: RegisterInput): Promise<{ profile: Profile; session: Session }> {
  const { email, password, name, phone, society_id } = input;

  // Reject duplicate email up-front for a clean message.
  const existing = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing.data) throw conflict('An account with this email already exists');

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no verification email required
    user_metadata: { name },
  });

  if (createErr || !created.user) {
    if (createErr?.message?.toLowerCase().includes('already')) {
      throw conflict('An account with this email already exists');
    }
    throw new AppError(500, 'auth_error', createErr?.message ?? 'Failed to create user');
  }

  const userId = created.user.id;

  const profileResult = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      email,
      phone: phone ?? null,
      name,
      role: 'resident' as UserRole,
      status: 'pending',
      society_id: society_id ?? null,
    })
    .select('*')
    .single();

  if (profileResult.error) {
    // Roll back the auth user so a failed profile insert doesn't orphan an account.
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => undefined);
    throw new AppError(500, 'db_error', profileResult.error.message);
  }

  const session = await login({ email, password });
  return { profile: profileResult.data, session: session.session };
}

/** Signs in with email + password and returns the Supabase session tokens. */
export async function login(input: { email: string; password: string }): Promise<{
  profile: Profile;
  session: Session;
}> {
  const { data, error } = await supabasePublic.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.session || !data.user) {
    throw unauthorized('Invalid email or password');
  }

  const profile = unwrap(
    await supabaseAdmin.from('profiles').select('*').eq('id', data.user.id).single()
  );

  return {
    profile,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  };
}

/** Exchanges a refresh token for a fresh session. */
export async function refresh(refreshToken: string): Promise<Session> {
  const { data, error } = await supabasePublic.auth.refreshSession({
    refresh_token: refreshToken,
  });
  if (error || !data.session) {
    throw unauthorized('Invalid or expired refresh token');
  }
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  };
}

/** Revokes the session associated with the caller's access token. */
export async function logout(accessToken: string): Promise<void> {
  await supabaseAdmin.auth.admin.signOut(accessToken).catch(() => undefined);
}
