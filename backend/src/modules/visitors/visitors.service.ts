import { supabaseAdmin } from '../../lib/supabase';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors';
import { unwrap } from '../../lib/db';
import type { Profile, Visitor, VisitorStatus, VisitorType } from '../../types/database.types';

const VISITOR_SELECT =
  '*, flat:flats(id, number, tower:towers(name)), created_by_profile:profiles!visitors_created_by_fkey(name, role)';

/** Flat ids the given resident belongs to. */
export async function residentFlatIds(profileId: string): Promise<string[]> {
  const rows = unwrap(
    await supabaseAdmin.from('flat_residents').select('flat_id').eq('profile_id', profileId)
  );
  return rows.map((r) => r.flat_id);
}

/** Random 6-char alphanumeric pass code for pre-approvals. */
function genCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

type CreateInput = {
  flat_id: string;
  name: string;
  phone?: string;
  type?: VisitorType;
  purpose?: string;
  vehicle_no?: string;
  photo_url?: string;
  expected_at?: string;
};

/**
 * Creates a visitor record. Behaviour depends on the caller's role:
 *  - guard: registers an arriving visitor as `pending` (awaiting resident approval)
 *  - resident: pre-approves an expected guest as `approved` with a pass code
 *  - admin: pre-approves as `approved`
 * Residents may only create for their own flats.
 */
export async function createVisitor(actor: Profile, input: CreateInput): Promise<Visitor> {
  const flat = await supabaseAdmin
    .from('flats')
    .select('id, society_id')
    .eq('id', input.flat_id)
    .maybeSingle();
  if (!flat.data) throw notFound('Flat not found');
  if (flat.data.society_id !== actor.society_id) throw forbidden('Flat is in another society');

  const isResident = actor.role === 'resident';
  if (isResident) {
    const myFlats = await residentFlatIds(actor.id);
    if (!myFlats.includes(input.flat_id)) {
      throw forbidden('You can only pre-approve visitors for your own flat');
    }
  }

  const preApproved = actor.role === 'resident' || actor.role === 'admin';

  return unwrap(
    await supabaseAdmin
      .from('visitors')
      .insert({
        society_id: flat.data.society_id,
        flat_id: input.flat_id,
        name: input.name,
        phone: input.phone ?? null,
        type: input.type ?? 'guest',
        purpose: input.purpose ?? null,
        vehicle_no: input.vehicle_no ?? null,
        photo_url: input.photo_url ?? null,
        expected_at: input.expected_at ?? null,
        is_pre_approved: preApproved,
        code: preApproved ? genCode() : null,
        status: preApproved ? 'approved' : 'pending',
        created_by: actor.id,
        approved_by: preApproved ? actor.id : null,
      })
      .select(VISITOR_SELECT)
      .single()
  );
}

type ListFilters = {
  status?: VisitorStatus;
  type?: VisitorType;
  flat_id?: string;
  from?: string;
  to?: string;
  mine?: boolean;
  limit: number;
  offset: number;
};

/** Lists visitors, scoped by role (residents see only their flats). */
export async function listVisitors(actor: Profile, filters: ListFilters): Promise<Visitor[]> {
  let q = supabaseAdmin
    .from('visitors')
    .select(VISITOR_SELECT)
    .eq('society_id', actor.society_id!)
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  // Residents are always scoped to their flats; `mine` lets any role (e.g. an
  // admin viewing the resident experience) opt into the same scoping.
  if (actor.role === 'resident' || filters.mine) {
    const flatIds = await residentFlatIds(actor.id);
    if (flatIds.length === 0) return [];
    q = q.in('flat_id', flatIds);
  }

  if (filters.flat_id) q = q.eq('flat_id', filters.flat_id);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.type) q = q.eq('type', filters.type);
  if (filters.from) q = q.gte('created_at', filters.from);
  if (filters.to) q = q.lte('created_at', filters.to);

  return unwrap(await q);
}

/** Fetches a single visitor, enforcing role-based visibility. */
export async function getVisitor(actor: Profile, id: string): Promise<Visitor> {
  const visitor = unwrap(
    await supabaseAdmin.from('visitors').select(VISITOR_SELECT).eq('id', id).single()
  );
  await assertCanView(actor, visitor);
  return visitor;
}

async function assertCanView(actor: Profile, visitor: Visitor): Promise<void> {
  if (visitor.society_id !== actor.society_id) throw notFound('Visitor not found');
  if (actor.role === 'resident') {
    const flatIds = await residentFlatIds(actor.id);
    if (!flatIds.includes(visitor.flat_id)) throw forbidden('Not your visitor');
  }
}

/** Resident/admin approves or rejects a pending visitor. */
export async function decide(
  actor: Profile,
  id: string,
  decision: 'approved' | 'rejected'
): Promise<Visitor> {
  const visitor: Visitor = unwrap(
    await supabaseAdmin.from('visitors').select('*').eq('id', id).single()
  );
  await assertCanView(actor, visitor);
  if (visitor.status !== 'pending') {
    throw conflict(`Visitor is already ${visitor.status}`);
  }

  return unwrap(
    await supabaseAdmin
      .from('visitors')
      .update({ status: decision, approved_by: actor.id })
      .eq('id', id)
      .eq('status', 'pending')
      .select(VISITOR_SELECT)
      .single()
  );
}

/** Guard/admin marks entry. Allowed only for approved visitors. */
export async function checkIn(id: string, societyId: string): Promise<Visitor> {
  const visitor: Visitor = unwrap(
    await supabaseAdmin.from('visitors').select('*').eq('id', id).single()
  );
  if (visitor.society_id !== societyId) throw notFound('Visitor not found');
  if (visitor.status !== 'approved') {
    throw badRequest(`Cannot check in a visitor with status "${visitor.status}"`);
  }
  return unwrap(
    await supabaseAdmin
      .from('visitors')
      .update({ status: 'checked_in', entry_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'approved')
      .select(VISITOR_SELECT)
      .single()
  );
}

/** Guard/admin marks exit. Allowed only for checked-in visitors. */
export async function checkOut(id: string, societyId: string): Promise<Visitor> {
  const visitor: Visitor = unwrap(
    await supabaseAdmin.from('visitors').select('*').eq('id', id).single()
  );
  if (visitor.society_id !== societyId) throw notFound('Visitor not found');
  if (visitor.status !== 'checked_in') {
    throw badRequest(`Cannot check out a visitor with status "${visitor.status}"`);
  }
  return unwrap(
    await supabaseAdmin
      .from('visitors')
      .update({ status: 'checked_out', exit_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'checked_in')
      .select(VISITOR_SELECT)
      .single()
  );
}
