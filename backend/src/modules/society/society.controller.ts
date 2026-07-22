import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { societyIdOf } from '../../lib/context';

const updateBody = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  address: z.string().trim().max(300).optional(),
});

export const societyRouter = Router();
societyRouter.use(authenticate);

// The caller's society.
societyRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const society = unwrap(
      await supabaseAdmin.from('societies').select('*').eq('id', societyIdOf(req)).single()
    );
    res.json({ society });
  })
);

societyRouter.patch(
  '/',
  requireRole('admin'),
  validate({ body: updateBody }),
  asyncHandler(async (req, res) => {
    const society = unwrap(
      await supabaseAdmin
        .from('societies')
        .update(body<typeof updateBody>(req))
        .eq('id', societyIdOf(req))
        .select('*')
        .single()
    );
    res.json({ society });
  })
);
