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
  const existingAdmin = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle();

  if (existingAdmin.data) {
    console.log(`Admin with email ${ADMIN_EMAIL} already exists (${existingAdmin.data.id})`);
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
    console.log(`Created admin "${ADMIN_NAME}" (${created.data.user.id})`);
  }

  console.log('\nSeed complete. Log in with:');
  console.log(`  email:    ${ADMIN_EMAIL}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message ?? err);
    process.exit(1);
  });
