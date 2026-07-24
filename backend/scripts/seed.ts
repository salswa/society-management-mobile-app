/**
 * Bootstraps a society + admin so the API is usable immediately.
 * Run migrations first, then: npm run seed
 *
 * Idempotent: re-running reuses the existing society/admin (matched by name/phone).
 */
import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabase';

const SOCIETY_NAME = process.env.SEED_SOCIETY_NAME ?? 'Green Meadows';
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? 'admin@portl.app').toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Society Admin';

async function main() {
  // 1. Society
  let societyId: string;
  const existingSociety = await supabaseAdmin
    .from('societies')
    .select('id')
    .eq('name', SOCIETY_NAME)
    .maybeSingle();

  if (existingSociety.data) {
    societyId = existingSociety.data.id;
    console.log(`Society "${SOCIETY_NAME}" already exists (${societyId})`);
  } else {
    const created = await supabaseAdmin
      .from('societies')
      .insert({ name: SOCIETY_NAME, address: 'Demo address' })
      .select('id')
      .single();
    if (created.error) throw created.error;
    societyId = created.data.id;
    console.log(`Created society "${SOCIETY_NAME}" (${societyId})`);
  }

  // 2. Admin profile
  let adminId: string;
  const existingAdmin = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle();

  if (existingAdmin.data) {
    adminId = existingAdmin.data.id;
    console.log(`Admin with email ${ADMIN_EMAIL} already exists (${adminId})`);
  } else {
    const created = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME },
    });
    if (created.error || !created.data.user) {
      throw created.error ?? new Error('Failed to create admin auth user');
    }

    const profile = await supabaseAdmin.from('profiles').insert({
      id: created.data.user.id,
      society_id: societyId,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: 'admin',
      status: 'active',
    });
    if (profile.error) {
      await supabaseAdmin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
      throw profile.error;
    }
    adminId = created.data.user.id;
    console.log(`Created admin "${ADMIN_NAME}" (${adminId})`);
  }

  // 3. Demo data so the mobile app is testable end-to-end immediately.
  const tower = await ensureTower(societyId, 'Tower A');
  const flat101 = await ensureFlat(societyId, tower, 'A-101', 1);
  const flat102 = await ensureFlat(societyId, tower, 'A-102', 1);

  // The admin also lives on-site (flat A-102), so the dual Admin/Resident
  // experience is testable immediately.
  await ensureFlatLink(flat102, adminId);

  const residentId = await ensureMember({
    societyId,
    email: 'riya@example.com',
    password: 'riya123',
    name: 'Riya Sharma',
    role: 'resident',
    phone: '+919000000001',
  });
  await ensureFlatLink(flat101, residentId);

  await ensureMember({
    societyId,
    email: 'guard@example.com',
    password: 'guard123',
    name: 'Gate Guard',
    role: 'guard',
  });

  // A self-registered, not-yet-approved resident (no society, no flat) so the
  // admin's Residents "Pending requests" flow is testable immediately.
  await ensurePendingSignup({
    email: 'pending@example.com',
    password: 'pending123',
    name: 'Neha Verma',
    phone: '+919000000002',
  });

  console.log('\nSeed complete. Accounts:');
  console.log(`  admin    → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}  (also resident of A-102)`);
  console.log('  resident → riya@example.com / riya123  (flat A-101)');
  console.log('  guard    → guard@example.com / guard123');
  console.log('  pending  → pending@example.com / pending123  (awaiting admin approval)');
}

async function ensureTower(societyId: string, name: string): Promise<string> {
  const existing = await supabaseAdmin
    .from('towers')
    .select('id')
    .eq('society_id', societyId)
    .eq('name', name)
    .maybeSingle();
  if (existing.data) return existing.data.id;
  const created = await supabaseAdmin
    .from('towers')
    .insert({ society_id: societyId, name })
    .select('id')
    .single();
  if (created.error) throw created.error;
  console.log(`Created tower "${name}"`);
  return created.data.id;
}

async function ensureFlat(
  societyId: string,
  towerId: string,
  number: string,
  floor: number
): Promise<string> {
  const existing = await supabaseAdmin
    .from('flats')
    .select('id')
    .eq('tower_id', towerId)
    .eq('number', number)
    .maybeSingle();
  if (existing.data) return existing.data.id;
  const created = await supabaseAdmin
    .from('flats')
    .insert({ society_id: societyId, tower_id: towerId, number, floor })
    .select('id')
    .single();
  if (created.error) throw created.error;
  console.log(`Created flat "${number}"`);
  return created.data.id;
}

async function ensureMember(input: {
  societyId: string;
  email: string;
  password: string;
  name: string;
  role: 'resident' | 'guard';
  phone?: string;
}): Promise<string> {
  const existing = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', input.email)
    .maybeSingle();
  if (existing.data) return existing.data.id;

  const created = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error(`Failed to create ${input.email}`);
  }

  const profile = await supabaseAdmin.from('profiles').insert({
    id: created.data.user.id,
    society_id: input.societyId,
    email: input.email,
    phone: input.phone ?? null,
    name: input.name,
    role: input.role,
    status: 'active',
  });
  if (profile.error) {
    await supabaseAdmin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
    throw profile.error;
  }
  console.log(`Created ${input.role} "${input.name}" (${input.email})`);
  return created.data.user.id;
}

async function ensurePendingSignup(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<void> {
  const existing = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', input.email)
    .maybeSingle();
  if (existing.data) {
    console.log(`Pending signup ${input.email} already exists`);
    return;
  }

  const created = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error(`Failed to create ${input.email}`);
  }

  // Mirrors self-registration: no society, no flat, status pending.
  const profile = await supabaseAdmin.from('profiles').insert({
    id: created.data.user.id,
    society_id: null,
    email: input.email,
    phone: input.phone ?? null,
    name: input.name,
    role: 'resident',
    status: 'pending',
  });
  if (profile.error) {
    await supabaseAdmin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
    throw profile.error;
  }
  console.log(`Created pending signup "${input.name}" (${input.email})`);
}

async function ensureFlatLink(flatId: string, profileId: string): Promise<void> {
  await supabaseAdmin.from('flat_residents').upsert(
    { flat_id: flatId, profile_id: profileId, is_owner: true, is_primary: true },
    { onConflict: 'flat_id,profile_id' }
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message ?? err);
    process.exit(1);
  });
