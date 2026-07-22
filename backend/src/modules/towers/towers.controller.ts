import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { societyIdOf } from '../../lib/context';
import { idParam } from '../../lib/validators';

const createBody = z.object({ name: z.string().trim().min(1).max(60) });
const updateBody = z.object({ name: z.string().trim().min(1).max(60) });

export const towersRouter = Router();
towersRouter.use(authenticate);

// Any society member can list towers; only admins mutate them.
towersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = unwrap(
      await supabaseAdmin
        .from('towers')
        .select('*')
        .eq('society_id', societyIdOf(req))
        .order('name')
    );
    res.json({ towers: rows });
  })
);

towersRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const tower = unwrap(
      await supabaseAdmin
        .from('towers')
        .insert({ society_id: societyIdOf(req), name: body<typeof createBody>(req).name })
        .select('*')
        .single()
    );
    res.status(201).json({ tower });
  })
);

towersRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam, body: updateBody }),
  asyncHandler(async (req, res) => {
    const tower = unwrap(
      await supabaseAdmin
        .from('towers')
        .update({ name: body<typeof updateBody>(req).name })
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('*')
        .single()
    );
    res.json({ tower });
  })
);

towersRouter.delete(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    unwrap(
      await supabaseAdmin
        .from('towers')
        .delete()
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('id')
        .single()
    );
    res.status(204).end();
  })
);
