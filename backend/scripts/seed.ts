/**
 * Bootstraps a society + admin and a rich set of demo data so the app is
 * testable end-to-end immediately. Run migrations first, then: npm run seed
 *
 * Idempotent: re-running reuses existing rows (matched by natural keys).
 */
import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabase';

const SOCIETY_NAME = process.env.SEED_SOCIETY_NAME ?? 'Green Meadows';
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? 'admin@portl.app').toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Society Admin';

async function main() {
  // 1. Society ---------------------------------------------------------------
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

  // 2. Admin -----------------------------------------------------------------
  let adminId: string;
  const existingAdmin = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .maybeSingle();

  if (existingAdmin.data) {
    adminId = existingAdmin.data.id;
    console.log(`Admin ${ADMIN_EMAIL} already exists (${adminId})`);
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
      phone: '9000000000',
      role: 'admin',
      user_type: 'resident', // admin also lives on-site (A-102)
      status: 'active',
    });
    if (profile.error) {
      await supabaseAdmin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
      throw profile.error;
    }
    adminId = created.data.user.id;
    console.log(`Created admin "${ADMIN_NAME}" (${adminId})`);
  }
  await supabaseAdmin.from('profiles').update({ phone: '9000000000' }).eq('id', adminId);

  // 3. Towers & flats --------------------------------------------------------
  const towerA = await ensureTower(societyId, 'Tower A');
  const towerB = await ensureTower(societyId, 'Tower B');
  const flats = {
    a101: await ensureFlat(societyId, towerA, 'A-101', 1),
    a102: await ensureFlat(societyId, towerA, 'A-102', 1),
    a103: await ensureFlat(societyId, towerA, 'A-103', 1),
    a104: await ensureFlat(societyId, towerA, 'A-104', 2),
    b201: await ensureFlat(societyId, towerB, 'B-201', 2),
    b202: await ensureFlat(societyId, towerB, 'B-202', 2),
    b203: await ensureFlat(societyId, towerB, 'B-203', 3),
  };

  // Admin also lives on-site (A-102) → dual Admin/Resident experience.
  await ensureFlatLink(flats.a102, adminId);

  // 4. Residents & guards (one account per flat) -----------------------------
  const riya = await ensureMember({
    societyId, email: 'riya@example.com', password: 'riya123',
    name: 'Riya Sharma', role: 'resident', phone: '9000000001',
  });
  await ensureFlatLink(flats.a101, riya);

  const amit = await ensureMember({
    societyId, email: 'amit@example.com', password: 'amit123',
    name: 'Amit Patel', role: 'resident', phone: '9000000003',
  });
  await ensureFlatLink(flats.a103, amit);

  const priya = await ensureMember({
    societyId, email: 'priya@example.com', password: 'priya123',
    name: 'Priya Nair', role: 'resident', phone: '9000000004',
  });
  await ensureFlatLink(flats.b201, priya);

  const rahul = await ensureMember({
    societyId, email: 'rahul@example.com', password: 'rahul123',
    name: 'Rahul Verma', role: 'resident', phone: '9000000005',
  });
  await ensureFlatLink(flats.b202, rahul);

  await ensureMember({
    societyId, email: 'guard@example.com', password: 'guard123',
    name: 'Gate Guard', role: 'guard', phone: '9000000007',
  });

  // Two pending sign-ups so both approval paths are testable:
  //  - a resident who didn't pick a flat (admin assigns at approval)
  //  - a non-resident (admin assigns guard/admin at approval)
  await ensurePendingSignup({
    societyId, email: 'pending@example.com', password: 'pending123',
    name: 'Neha Verma', user_type: 'resident', phone: '9000000002', flatId: flats.a104,
  });
  await ensurePendingSignup({
    societyId, email: 'kabir@example.com', password: 'kabir123',
    name: 'Kabir Singh', user_type: 'non_resident', phone: '9000000006',
  });

  // 5. Staff & service-provider directory ------------------------------------
  await ensureStaff(societyId, { name: 'Ramesh Kumar', kind: 'staff', category: 'security', phone: '+919111111111' });
  await ensureStaff(societyId, { name: 'Sunita Devi', kind: 'staff', category: 'housekeeping', phone: '+919111111112' });
  await ensureStaff(societyId, { name: 'Vijay Singh', kind: 'staff', category: 'manager', phone: '+919111111113' });
  await ensureStaff(societyId, { name: 'QuickFix Plumbing', kind: 'service_provider', category: 'plumber', phone: '+919222222221', company: 'QuickFix Services' });
  await ensureStaff(societyId, { name: 'BrightSpark Electricals', kind: 'service_provider', category: 'electrician', phone: '+919222222222', company: 'BrightSpark' });
  await ensureStaff(societyId, { name: 'GreenThumb Gardening', kind: 'service_provider', category: 'gardener', phone: '+919222222223', company: 'GreenThumb' });

  // 6. Notices ---------------------------------------------------------------
  await ensureNotice(societyId, adminId, {
    title: 'Water tank cleaning on Saturday',
    body: 'The overhead water tanks will be cleaned this Saturday from 10am–1pm. Water supply may be interrupted during this window.',
    category: 'maintenance', is_pinned: true,
  });
  await ensureNotice(societyId, adminId, {
    title: 'Diwali celebration in the clubhouse',
    body: 'Join us for the society Diwali get-together this Sunday evening at 7pm in the clubhouse. Snacks and games for all ages!',
    category: 'event', is_pinned: false,
  });
  await ensureNotice(societyId, adminId, {
    title: 'Updated visitor entry policy',
    body: 'All visitors must now be pre-approved by residents or registered at the gate. Please brief your household staff accordingly.',
    category: 'general', is_pinned: false,
  });

  // 7. Amenities -------------------------------------------------------------
  const clubhouse = await ensureAmenity(societyId, { name: 'Clubhouse', description: 'Community hall for events and gatherings.', capacity: 2, open_time: '06:00', close_time: '22:00', slot_minutes: 60 });
  const gym = await ensureAmenity(societyId, { name: 'Gym', description: 'Fully equipped fitness center.', capacity: 5, open_time: '05:00', close_time: '23:00', slot_minutes: 60 });
  await ensureAmenity(societyId, { name: 'Tennis Court', description: 'Outdoor synthetic court.', capacity: 1, open_time: '06:00', close_time: '21:00', slot_minutes: 60 });
  await ensureAmenity(societyId, { name: 'Party Hall', description: 'Air-conditioned hall for private functions.', capacity: 1, open_time: '09:00', close_time: '23:00', slot_minutes: 120 });

  // 8. Complaints ------------------------------------------------------------
  await ensureComplaint(societyId, riya, flats.a101, { title: 'Kitchen tap leaking', description: 'The kitchen tap has been dripping for two days.', category: 'plumbing', priority: 'high', status: 'open' });
  await ensureComplaint(societyId, amit, flats.a103, { title: 'Corridor light not working', description: 'The light outside A-103 is out.', category: 'electrical', priority: 'medium', status: 'in_progress' });
  await ensureComplaint(societyId, priya, flats.b201, { title: 'Lift making noise on B wing', description: 'The lift makes a grinding sound between floors 2 and 3.', category: 'general', priority: 'low', status: 'open' });

  // 9. Polls -----------------------------------------------------------------
  await ensurePoll(societyId, adminId, {
    question: 'Should we install solar panels on the rooftops?',
    description: 'A one-time investment that could reduce common-area electricity bills.',
    is_multi: false,
    options: ['Yes, go ahead', 'No', 'Need more details'],
  });
  await ensurePoll(societyId, adminId, {
    question: 'Best time for the monthly society meeting?',
    description: 'Pick the slot that works for you.',
    is_multi: false,
    options: ['Saturday morning', 'Saturday evening', 'Sunday morning'],
  });

  // 10. Maintenance dues -----------------------------------------------------
  const now = new Date();
  const thisPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevPeriod = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

  await ensureInvoice(societyId, flats.a101, { period: thisPeriod, amount: 2500, due_date: `${thisPeriod}-10`, status: 'pending' });
  await ensureInvoice(societyId, flats.a101, { period: prevPeriod, amount: 2500, due_date: `${prevPeriod}-10`, status: 'paid' });
  await ensureInvoice(societyId, flats.a103, { period: thisPeriod, amount: 2500, due_date: `${thisPeriod}-10`, status: 'pending' });
  await ensureInvoice(societyId, flats.b201, { period: thisPeriod, amount: 3000, due_date: `${thisPeriod}-10`, status: 'paid' });
  await ensureInvoice(societyId, flats.a102, { period: thisPeriod, amount: 2500, due_date: `${thisPeriod}-10`, status: 'pending' });

  // 11. A couple of upcoming amenity bookings (for the admin bookings view) --
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  await ensureBooking(clubhouse, riya, flats.a101, atHour(tomorrow, 18), atHour(tomorrow, 19));
  await ensureBooking(gym, amit, flats.a103, atHour(tomorrow, 7), atHour(tomorrow, 8));

  console.log('\nSeed complete. Accounts:');
  console.log(`  admin    → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}  (also resident of A-102)`);
  console.log('  resident → riya@example.com / riya123    (A-101)');
  console.log('  resident → amit@example.com / amit123    (A-103)');
  console.log('  resident → priya@example.com / priya123  (B-201)');
  console.log('  resident → rahul@example.com / rahul123  (B-202)');
  console.log('  guard    → guard@example.com / guard123');
  console.log('  pending  → pending@example.com / pending123  (resident, no flat)');
  console.log('  pending  → kabir@example.com / kabir123      (non-resident)');
}

// --- Helpers ----------------------------------------------------------------

async function ensureTower(societyId: string, name: string): Promise<string> {
  const existing = await supabaseAdmin
    .from('towers').select('id').eq('society_id', societyId).eq('name', name).maybeSingle();
  if (existing.data) return existing.data.id;
  const created = await supabaseAdmin
    .from('towers').insert({ society_id: societyId, name }).select('id').single();
  if (created.error) throw created.error;
  console.log(`Created tower "${name}"`);
  return created.data.id;
}

async function ensureFlat(societyId: string, towerId: string, number: string, floor: number): Promise<string> {
  const existing = await supabaseAdmin
    .from('flats').select('id').eq('tower_id', towerId).eq('number', number).maybeSingle();
  if (existing.data) return existing.data.id;
  const created = await supabaseAdmin
    .from('flats').insert({ society_id: societyId, tower_id: towerId, number, floor }).select('id').single();
  if (created.error) throw created.error;
  console.log(`Created flat "${number}"`);
  return created.data.id;
}

async function ensureMember(input: {
  societyId: string; email: string; password: string;
  name: string; role: 'resident' | 'guard'; phone?: string;
}): Promise<string> {
  const existing = await supabaseAdmin
    .from('profiles').select('id').eq('email', input.email).maybeSingle();
  if (existing.data) {
    if (input.phone) {
      await supabaseAdmin.from('profiles').update({ phone: input.phone }).eq('id', existing.data.id);
    }
    return existing.data.id;
  }

  const created = await supabaseAdmin.auth.admin.createUser({
    email: input.email, password: input.password, email_confirm: true,
    user_metadata: { name: input.name },
  });
  if (created.error || !created.data.user) {
    throw created.error ?? new Error(`Failed to create ${input.email}`);
  }
  const profile = await supabaseAdmin.from('profiles').insert({
    id: created.data.user.id, society_id: input.societyId, email: input.email,
    phone: input.phone ?? null, name: input.name, role: input.role, status: 'active',
    user_type: input.role === 'guard' ? 'non_resident' : 'resident',
  });
  if (profile.error) {
    await supabaseAdmin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
    throw profile.error;
  }
  console.log(`Created ${input.role} "${input.name}" (${input.email})`);
  return created.data.user.id;
}

async function ensurePendingSignup(input: {
  societyId: string; email: string; password: string; name: string;
  user_type: 'resident' | 'non_resident'; phone?: string; flatId?: string;
}): Promise<void> {
  let profileId: string;
  const existing = await supabaseAdmin
    .from('profiles').select('id').eq('email', input.email).maybeSingle();

  if (existing.data) {
    profileId = existing.data.id;
    if (input.phone) {
      await supabaseAdmin.from('profiles').update({ phone: input.phone }).eq('id', profileId);
    }
    console.log(`Pending signup ${input.email} already exists`);
  } else {
    const created = await supabaseAdmin.auth.admin.createUser({
      email: input.email, password: input.password, email_confirm: true,
      user_metadata: { name: input.name },
    });
    if (created.error || !created.data.user) {
      throw created.error ?? new Error(`Failed to create ${input.email}`);
    }
    // Mirrors self-registration: society set, status pending, role placeholder.
    const profile = await supabaseAdmin.from('profiles').insert({
      id: created.data.user.id, society_id: input.societyId, email: input.email,
      phone: input.phone ?? null, name: input.name, role: 'resident',
      user_type: input.user_type, status: 'pending',
    });
    if (profile.error) {
      await supabaseAdmin.auth.admin.deleteUser(created.data.user.id).catch(() => undefined);
      throw profile.error;
    }
    profileId = created.data.user.id;
    console.log(`Created pending ${input.user_type} "${input.name}" (${input.email})`);
  }

  // Reserve the chosen flat (idempotent — runs even for an existing signup).
  if (input.flatId) await ensureFlatLink(input.flatId, profileId);
}

async function ensureFlatLink(flatId: string, profileId: string): Promise<void> {
  await supabaseAdmin.from('flat_residents').upsert(
    { flat_id: flatId, profile_id: profileId, is_owner: true, is_primary: true },
    { onConflict: 'flat_id,profile_id' }
  );
}

async function ensureStaff(societyId: string, input: {
  name: string; kind: 'staff' | 'service_provider'; category: string; phone?: string; company?: string;
}): Promise<void> {
  const existing = await supabaseAdmin
    .from('staff_directory').select('id')
    .eq('society_id', societyId).eq('name', input.name).eq('kind', input.kind).maybeSingle();
  if (existing.data) return;
  const res = await supabaseAdmin.from('staff_directory').insert({
    society_id: societyId, name: input.name, kind: input.kind, category: input.category,
    phone: input.phone ?? null, company: input.company ?? null, is_active: true,
  });
  if (res.error) throw res.error;
  console.log(`Created ${input.kind} "${input.name}"`);
}

async function ensureNotice(societyId: string, postedBy: string, input: {
  title: string; body: string; category: string; is_pinned: boolean;
}): Promise<void> {
  const existing = await supabaseAdmin
    .from('notices').select('id').eq('society_id', societyId).eq('title', input.title).maybeSingle();
  if (existing.data) return;
  const res = await supabaseAdmin.from('notices').insert({
    society_id: societyId, posted_by: postedBy, title: input.title,
    body: input.body, category: input.category, is_pinned: input.is_pinned,
  });
  if (res.error) throw res.error;
  console.log(`Created notice "${input.title}"`);
}

async function ensureAmenity(societyId: string, input: {
  name: string; description: string; capacity: number; open_time: string; close_time: string; slot_minutes: number;
}): Promise<string> {
  const existing = await supabaseAdmin
    .from('amenities').select('id').eq('society_id', societyId).eq('name', input.name).maybeSingle();
  if (existing.data) return existing.data.id;
  const created = await supabaseAdmin.from('amenities').insert({
    society_id: societyId, name: input.name, description: input.description, capacity: input.capacity,
    open_time: input.open_time, close_time: input.close_time, slot_minutes: input.slot_minutes, is_active: true,
  }).select('id').single();
  if (created.error) throw created.error;
  console.log(`Created amenity "${input.name}"`);
  return created.data.id;
}

async function ensureComplaint(societyId: string, raisedBy: string, flatId: string, input: {
  title: string; description: string; category: string;
  priority: 'low' | 'medium' | 'high'; status: 'open' | 'in_progress' | 'resolved' | 'closed';
}): Promise<void> {
  const existing = await supabaseAdmin
    .from('complaints').select('id')
    .eq('society_id', societyId).eq('raised_by', raisedBy).eq('title', input.title).maybeSingle();
  if (existing.data) return;
  const res = await supabaseAdmin.from('complaints').insert({
    society_id: societyId, raised_by: raisedBy, flat_id: flatId, title: input.title,
    description: input.description, category: input.category, priority: input.priority, status: input.status,
  });
  if (res.error) throw res.error;
  console.log(`Created complaint "${input.title}"`);
}

async function ensurePoll(societyId: string, createdBy: string, input: {
  question: string; description: string; is_multi: boolean; options: string[];
}): Promise<void> {
  const existing = await supabaseAdmin
    .from('polls').select('id').eq('society_id', societyId).eq('question', input.question).maybeSingle();
  if (existing.data) return;
  const created = await supabaseAdmin.from('polls').insert({
    society_id: societyId, created_by: createdBy, question: input.question,
    description: input.description, is_multi: input.is_multi, status: 'open',
  }).select('id').single();
  if (created.error) throw created.error;
  const opts = await supabaseAdmin.from('poll_options').insert(
    input.options.map((text, position) => ({ poll_id: created.data.id, text, position }))
  );
  if (opts.error) throw opts.error;
  console.log(`Created poll "${input.question}"`);
}

async function ensureInvoice(societyId: string, flatId: string, input: {
  period: string; amount: number; due_date?: string; status: 'pending' | 'paid';
}): Promise<void> {
  const existing = await supabaseAdmin
    .from('maintenance_invoices').select('id')
    .eq('society_id', societyId).eq('flat_id', flatId).eq('period', input.period).maybeSingle();
  if (existing.data) return;
  const res = await supabaseAdmin.from('maintenance_invoices').insert({
    society_id: societyId, flat_id: flatId, period: input.period, amount: input.amount,
    due_date: input.due_date ?? null, status: input.status,
    paid_at: input.status === 'paid' ? new Date().toISOString() : null,
  });
  if (res.error) throw res.error;
  console.log(`Created invoice ${input.period} for flat`);
}

async function ensureBooking(amenityId: string, profileId: string, flatId: string, startIso: string, endIso: string): Promise<void> {
  const existing = await supabaseAdmin
    .from('amenity_bookings').select('id')
    .eq('amenity_id', amenityId).eq('profile_id', profileId).eq('start_time', startIso).maybeSingle();
  if (existing.data) return;
  const res = await supabaseAdmin.from('amenity_bookings').insert({
    amenity_id: amenityId, profile_id: profileId, flat_id: flatId,
    start_time: startIso, end_time: endIso, status: 'booked',
  });
  if (res.error) throw res.error;
  console.log('Created amenity booking');
}

function atHour(base: Date, hour: number): string {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message ?? err);
    process.exit(1);
  });
