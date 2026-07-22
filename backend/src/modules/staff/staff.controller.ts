import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params, query } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { societyIdOf } from '../../lib/context';
import { idParam } from '../../lib/validators';

const createBody = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(['staff', 'service_provider']).default('staff'),
  category: z.string().trim().max(40).default('general'),
  phone: z.string().trim().max(20).optional(),
  company: z.string().trim().max(80).optional(),
  photo_url: z.string().url().optional(),
  is_active: z.boolean().default(true),
});
const updateBody = createBody.partial();
const listQuery = z.object({
  kind: z.enum(['staff', 'service_provider']).optional(),
  category: z.string().trim().max(40).optional(),
});

export const staffRouter = Router();
staffRouter.use(authenticate);

// Directory is readable by all society members.
staffRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { kind, category } = query<typeof listQuery>(req);
    let q = supabaseAdmin
      .from('staff_directory')
      .select('*')
      .eq('society_id', societyIdOf(req))
      .eq('is_active', true)
      .order('name');
    if (kind) q = q.eq('kind', kind);
    if (category) q = q.eq('category', category);
    res.json({ staff: unwrap(await q) });
  })
);

staffRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const member = unwrap(
      await supabaseAdmin
        .from('staff_directory')
        .insert({ society_id: societyIdOf(req), ...body<typeof createBody>(req) })
        .select('*')
        .single()
    );
    res.status(201).json({ staff: member });
  })
);

staffRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam, body: updateBody }),
  asyncHandler(async (req, res) => {
    const member = unwrap(
      await supabaseAdmin
        .from('staff_directory')
        .update(body<typeof updateBody>(req))
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('*')
        .single()
    );
    res.json({ staff: member });
  })
);

staffRouter.delete(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    unwrap(
      await supabaseAdmin
        .from('staff_directory')
        .delete()
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('id')
        .single()
    );
    res.status(204).end();
  })
);
