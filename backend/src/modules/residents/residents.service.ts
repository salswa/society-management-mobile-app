import { supabaseAdmin } from '../../lib/supabase';
import { AppError, conflict, forbidden, notFound } from '../../lib/errors';
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

/** The profile currently linked to a flat, or null if it's vacant. */
export async function flatOccupantId(flatId: string): Promise<string | null> {
  const row = await supabaseAdmin
    .from('flat_residents')
    .select('profile_id')
    .eq('flat_id', flatId)
    .maybeSingle();
  return row.data?.profile_id ?? null;
}

/**
 * Sets a resident's single flat. Enforces one account per flat: rejects a flat
 * already held by someone else, and frees the resident's previous flat (move).
 */
export async function assignFlat(input: {
  profile_id: string;
  flat_id: string;
  is_owner?: boolean;
  is_primary?: boolean;
}): Promise<void> {
  const occupant = await flatOccupantId(input.flat_id);
  if (occupant && occupant !== input.profile_id) {
    throw conflict('This flat already has a resident');
  }

  // One flat per resident: free their previous flat before linking the new one.
  unwrap(
    await supabaseAdmin.from('flat_residents').delete().eq('profile_id', input.profile_id).select()
  );

  unwrap(
    await supabaseAdmin
      .from('flat_residents')
      .insert({
        flat_id: input.flat_id,
        profile_id: input.profile_id,
        is_owner: input.is_owner ?? false,
        is_primary: input.is_primary ?? true,
      })
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
  role?: UserRole;
}): Promise<Profile> {
  // Reject an occupied flat before activating, so we never leave an activated,
  // flat-less account behind.
  if (input.flat_id) {
    const occupant = await flatOccupantId(input.flat_id);
    if (occupant && occupant !== input.profile_id) {
      throw conflict('This flat already has a resident');
    }
  }

  const profile = unwrap(
    await supabaseAdmin
      .from('profiles')
      .update({
        status: 'active',
        society_id: input.society_id,
        ...(input.role ? { role: input.role } : {}),
      })
      .eq('id', input.profile_id)
      .select('*')
      .single()
  );
  if (input.flat_id) {
    await assignFlat({ profile_id: input.profile_id, flat_id: input.flat_id });
  }
  return profile;
}

/** Changes a member's role within the admin's society (e.g. promote to admin). */
export async function setRole(input: {
  society_id: string;
  profile_id: string;
  role: UserRole;
}): Promise<Profile> {
  return unwrap(
    await supabaseAdmin
      .from('profiles')
      .update({ role: input.role })
      .eq('id', input.profile_id)
      .eq('society_id', input.society_id)
      .select('*')
      .single()
  );
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

/**
 * Removes a member: rejecting a pending sign-up or deleting an existing account.
 * Allowed for members of the admin's society, or an unassigned pending sign-up.
 * Deleting the auth user cascades to the profile and its flat_residents links;
 * visitor rows they created keep their history (created_by/approved_by → null).
 */
export async function deleteMember(input: {
  society_id: string;
  profile_id: string;
}): Promise<void> {
  const target = await supabaseAdmin
    .from('profiles')
    .select('id, society_id, status')
    .eq('id', input.profile_id)
    .maybeSingle();
  if (!target.data) throw notFound('Member not found');

  const inSociety = target.data.society_id === input.society_id;
  const isUnassignedPending =
    target.data.society_id === null && target.data.status === 'pending';
  if (!inSociety && !isUnassignedPending) {
    throw forbidden('Member is not in your society');
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(input.profile_id);
  if (error) throw new AppError(500, 'auth_error', error.message);
}
