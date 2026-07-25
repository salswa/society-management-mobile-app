import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params, query } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { societyIdOf } from '../../lib/context';
import { idParam, uuidSchema } from '../../lib/validators';

const createBody = z.object({
  tower_id: uuidSchema,
  number: z.string().trim().min(1).max(20),
  floor: z.coerce.number().int().optional(),
});
const updateBody = z.object({
  number: z.string().trim().min(1).max(20).optional(),
  floor: z.coerce.number().int().optional(),
});
const listQuery = z.object({ tower_id: uuidSchema.optional() });

export const flatsRouter = Router();
flatsRouter.use(authenticate);

flatsRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { tower_id } = query<typeof listQuery>(req);
    let q = supabaseAdmin
      .from('flats')
      .select('*, tower:towers(name), flat_residents(profile:profiles(id, name))')
      .eq('society_id', societyIdOf(req))
      .order('number');
    if (tower_id) q = q.eq('tower_id', tower_id);
    res.json({ flats: unwrap(await q) });
  })
);

flatsRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const input = body<typeof createBody>(req);
    const flat = unwrap(
      await supabaseAdmin
        .from('flats')
        .insert({
          society_id: societyIdOf(req),
          tower_id: input.tower_id,
          number: input.number,
          floor: input.floor ?? null,
        })
        .select('*')
        .single()
    );
    res.status(201).json({ flat });
  })
);

flatsRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam, body: updateBody }),
  asyncHandler(async (req, res) => {
    const flat = unwrap(
      await supabaseAdmin
        .from('flats')
        .update(body<typeof updateBody>(req))
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('*')
        .single()
    );
    res.json({ flat });
  })
);

flatsRouter.delete(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    unwrap(
      await supabaseAdmin
        .from('flats')
        .delete()
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('id')
        .single()
    );
    res.status(204).end();
  })
);
