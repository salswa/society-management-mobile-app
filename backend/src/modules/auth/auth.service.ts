import { supabaseAdmin, supabasePublic } from '../../lib/supabase';
import { AppError, badRequest, conflict, notFound, unauthorized } from '../../lib/errors';
import { unwrap } from '../../lib/db';
import { flatOccupantId } from '../residents/residents.service';
import { notifyNewSignup } from '../../lib/push';
import type { Profile, UserRole } from '../../types/database.types';

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
  society_id: string;
  user_type: 'resident' | 'non_resident';
  flat_id?: string;
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
  const { email, password, name, phone, society_id, user_type, flat_id } = input;

  // Reject duplicate email up-front for a clean message.
  const existing = await supabaseAdmin.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing.data) throw conflict('An account with this email already exists');

  // Validate the society and, if a flat was chosen, that it's in the society and free.
  const society = await supabaseAdmin.from('societies').select('id').eq('id', society_id).maybeSingle();
  if (!society.data) throw notFound('Society not found');

  // Residents must pick a flat at registration.
  if (user_type === 'resident' && !flat_id) throw badRequest('Select your flat');

  if (flat_id) {
    const flat = await supabaseAdmin
      .from('flats')
      .select('id, society_id')
      .eq('id', flat_id)
      .maybeSingle();
    if (!flat.data || flat.data.society_id !== society_id) throw notFound('Flat not found');
    if (await flatOccupantId(flat_id)) throw conflict('That flat is already taken');
  }

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

  try {
    const profile = unwrap(
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          phone: phone ?? null,
          name,
          role: 'resident' as UserRole, // placeholder; the real role is set at approval
          user_type,
          status: 'pending',
          society_id,
        })
        .select('*')
        .single()
    );

    // Residents may reserve a flat at sign-up (optional; the unique index guards races).
    if (flat_id) {
      unwrap(
        await supabaseAdmin
          .from('flat_residents')
          .insert({ flat_id, profile_id: userId, is_owner: true, is_primary: true })
          .select('flat_id')
          .single()
      );
    }

    // Let admins know a new member is awaiting approval.
    await notifyNewSignup(society_id, name, userId);

    const session = await login({ email, password });
    return { profile, session: session.session };
  } catch (err) {
    // Roll back the auth user so a failed insert doesn't orphan an account.
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => undefined);
    throw err;
  }
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
