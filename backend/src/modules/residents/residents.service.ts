import { supabaseAdmin } from '../../lib/supabase';
import { AppError, conflict } from '../../lib/errors';
import { unwrap } from '../../lib/db';
import type { Profile, UserRole } from '../../types/database.types';

type CreateMemberInput = {
  society_id: string;
  email: string;
  password: string;
  name: string;
  role: Extract<UserRole, 'resident' | 'guard'>;
  phone?: string;
  flat_id?: string;
  is_owner?: boolean;
  is_primary?: boolean;
};

/**
 * Admin-driven onboarding of a resident or guard. Creates an email-confirmed
 * auth user, an active profile in the admin's society, and (for residents with a
 * flat) the flat membership — rolling back the auth user on any failure.
 */
export async function createMember(input: CreateMemberInput): Promise<Profile> {
  const existing = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', input.email)
    .maybeSingle();
  if (existing.data) throw conflict('An account with this email already exists');

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
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
          society_id: input.society_id,
          email: input.email,
          phone: input.phone ?? null,
          name: input.name,
          role: input.role,
          status: 'active',
        })
        .select('*')
        .single()
    );

    if (input.flat_id) {
      await assignFlat({
        profile_id: userId,
        flat_id: input.flat_id,
        is_owner: input.is_owner,
        is_primary: input.is_primary,
      });
    }

    return profile;
  } catch (err) {
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => undefined);
    throw err;
  }
}

/** Links a resident to a flat (idempotent upsert on the composite key). */
export async function assignFlat(input: {
  profile_id: string;
  flat_id: string;
  is_owner?: boolean;
  is_primary?: boolean;
}): Promise<void> {
  unwrap(
    await supabaseAdmin
      .from('flat_residents')
      .upsert(
        {
          flat_id: input.flat_id,
          profile_id: input.profile_id,
          is_owner: input.is_owner ?? false,
          is_primary: input.is_primary ?? false,
        },
        { onConflict: 'flat_id,profile_id' }
      )
      .select('flat_id')
      .single()
  );
}

/**
 * Approves a pending self-registered resident: sets status=active, attaches them
 * to the admin's society, and optionally links a flat.
 */
export async function approveResident(input: {
  society_id: string;
  profile_id: string;
  flat_id?: string;
}): Promise<Profile> {
  const profile = unwrap(
    await supabaseAdmin
      .from('profiles')
      .update({ status: 'active', society_id: input.society_id })
      .eq('id', input.profile_id)
      .select('*')
      .single()
  );
  if (input.flat_id) {
    await assignFlat({ profile_id: input.profile_id, flat_id: input.flat_id });
  }
  return profile;
}

/** Enables/disables an account within the admin's society. */
export async function setStatus(input: {
  society_id: string;
  profile_id: string;
  status: 'active' | 'disabled';
}): Promise<Profile> {
  return unwrap(
    await supabaseAdmin
      .from('profiles')
      .update({ status: input.status })
      .eq('id', input.profile_id)
      .eq('society_id', input.society_id)
      .select('*')
      .single()
  );
}
