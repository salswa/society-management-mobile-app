import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params, query } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { societyIdOf } from '../../lib/context';
import { emailSchema, idParam, passwordSchema, phoneSchema, uuidSchema } from '../../lib/validators';
import * as service from './residents.service';

const createBody = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(80),
  role: z.enum(['resident', 'guard']).default('resident'),
  phone: phoneSchema.optional(),
  flat_id: uuidSchema.optional(),
  is_owner: z.boolean().optional(),
  is_primary: z.boolean().optional(),
});

const listQuery = z.object({
  role: z.enum(['resident', 'guard', 'admin']).optional(),
  status: z.enum(['pending', 'active', 'disabled']).optional(),
});

const approveBody = z.object({ flat_id: uuidSchema.optional() });
const statusBody = z.object({ status: z.enum(['active', 'disabled']) });
const assignFlatBody = z.object({
  flat_id: uuidSchema,
  is_owner: z.boolean().optional(),
  is_primary: z.boolean().optional(),
});
const searchQuery = z.object({ q: z.string().trim().min(1).max(60) });

export const residentsRouter = Router();
residentsRouter.use(authenticate);

// --- Guard/admin: search residents by name, flat number, or phone -----------
residentsRouter.get(
  '/search',
  requireRole('guard', 'admin'),
  validate({ query: searchQuery }),
  asyncHandler(async (req, res) => {
    const { q } = query<typeof searchQuery>(req);
    const societyId = societyIdOf(req);

    // Match residents by name/phone, plus flats whose number matches.
    const byPerson = unwrap(
      await supabaseAdmin
        .from('profiles')
        .select('id, name, phone, role, flat_residents(flat:flats(id, number, tower:towers(name)))')
        .eq('society_id', societyId)
        .eq('role', 'resident')
        .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(20)
    );

    const byFlat = unwrap(
      await supabaseAdmin
        .from('flats')
        .select('id, number, tower:towers(name), residents:flat_residents(profile:profiles(id, name, phone))')
        .eq('society_id', societyId)
        .ilike('number', `%${q}%`)
        .limit(20)
    );

    res.json({ residents: byPerson, flats: byFlat });
  })
);

// --- Admin: manage members --------------------------------------------------
residentsRouter.get(
  '/',
  requireRole('admin'),
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { role, status } = query<typeof listQuery>(req);
    const societyId = societyIdOf(req);
    let q = supabaseAdmin
      .from('profiles')
      .select('*, flat_residents(flat:flats(id, number, tower:towers(name)))')
      .order('created_at', { ascending: false });

    // Self-registered sign-ups have society_id = null until approved; surface
    // them (only under the pending filter) so the admin can approve/reject.
    if (status === 'pending') {
      q = q.or(`society_id.eq.${societyId},society_id.is.null`);
    } else {
      q = q.eq('society_id', societyId);
    }
    if (role) q = q.eq('role', role);
    if (status) q = q.eq('status', status);
    res.json({ residents: unwrap(await q) });
  })
);

residentsRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const input = body<typeof createBody>(req);
    const profile = await service.createMember({ society_id: societyIdOf(req), ...input });
    res.status(201).json({ resident: profile });
  })
);

residentsRouter.post(
  '/:id/approve',
  requireRole('admin'),
  validate({ params: idParam, body: approveBody }),
  asyncHandler(async (req, res) => {
    const profile = await service.approveResident({
      society_id: societyIdOf(req),
      profile_id: params<typeof idParam>(req).id,
      flat_id: body<typeof approveBody>(req).flat_id,
    });
    res.json({ resident: profile });
  })
);

residentsRouter.patch(
  '/:id/status',
  requireRole('admin'),
  validate({ params: idParam, body: statusBody }),
  asyncHandler(async (req, res) => {
    const profile = await service.setStatus({
      society_id: societyIdOf(req),
      profile_id: params<typeof idParam>(req).id,
      status: body<typeof statusBody>(req).status,
    });
    res.json({ resident: profile });
  })
);

residentsRouter.post(
  '/:id/flats',
  requireRole('admin'),
  validate({ params: idParam, body: assignFlatBody }),
  asyncHandler(async (req, res) => {
    const input = body<typeof assignFlatBody>(req);
    await service.assignFlat({ profile_id: params<typeof idParam>(req).id, ...input });
    res.status(204).end();
  })
);

// Reject a pending sign-up or remove an existing member.
residentsRouter.delete(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    await service.deleteMember({
      society_id: societyIdOf(req),
      profile_id: params<typeof idParam>(req).id,
    });
    res.status(204).end();
  })
);
