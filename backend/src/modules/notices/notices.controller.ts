import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params, query } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { profileOf, societyIdOf } from '../../lib/context';
import { idParam, paginationSchema } from '../../lib/validators';

const createBody = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(5000),
  category: z.string().trim().max(40).default('general'),
  is_pinned: z.boolean().default(false),
  expires_at: z.string().datetime().optional(),
});
const updateBody = createBody.partial();

export const noticesRouter = Router();
noticesRouter.use(authenticate);

noticesRouter.get(
  '/',
  validate({ query: paginationSchema }),
  asyncHandler(async (req, res) => {
    const { limit, offset } = query<typeof paginationSchema>(req);
    const nowIso = new Date().toISOString();
    const notices = unwrap(
      await supabaseAdmin
        .from('notices')
        .select('*, posted_by_profile:profiles(id, name)')
        .eq('society_id', societyIdOf(req))
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1)
    );
    res.json({ notices });
  })
);

noticesRouter.get(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const notice = unwrap(
      await supabaseAdmin
        .from('notices')
        .select('*, posted_by_profile:profiles(id, name)')
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .single()
    );
    res.json({ notice });
  })
);

noticesRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const input = body<typeof createBody>(req);
    const notice = unwrap(
      await supabaseAdmin
        .from('notices')
        .insert({
          society_id: societyIdOf(req),
          posted_by: profileOf(req).id,
          title: input.title,
          body: input.body,
          category: input.category,
          is_pinned: input.is_pinned,
          expires_at: input.expires_at ?? null,
        })
        .select('*')
        .single()
    );
    res.status(201).json({ notice });
  })
);

noticesRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam, body: updateBody }),
  asyncHandler(async (req, res) => {
    const notice = unwrap(
      await supabaseAdmin
        .from('notices')
        .update(body<typeof updateBody>(req))
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('*')
        .single()
    );
    res.json({ notice });
  })
);

noticesRouter.delete(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    unwrap(
      await supabaseAdmin
        .from('notices')
        .delete()
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('id')
        .single()
    );
    res.status(204).end();
  })
);
