import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { validate, body } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { profileOf } from '../../lib/context';

const updateBody = z.object({
  name: z.string().trim().min(1).max(80).optional(),
});

const pushTokenBody = z.object({
  expo_push_token: z.string().min(1),
});

export const profileRouter = Router();

profileRouter.use(authenticate);

profileRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = profileOf(req);
    const flats = unwrap(
      await supabaseAdmin
        .from('flat_residents')
        .select('is_owner, is_primary, flat:flats(id, number, tower:towers(name))')
        .eq('profile_id', me.id)
    );
    res.json({ profile: me, flats });
  })
);

profileRouter.patch(
  '/',
  validate({ body: updateBody }),
  asyncHandler(async (req, res) => {
    const patch = body<typeof updateBody>(req);
    const profile = unwrap(
      await supabaseAdmin
        .from('profiles')
        .update(patch)
        .eq('id', profileOf(req).id)
        .select('*')
        .single()
    );
    res.json({ profile });
  })
);

// Stored now; used when the push-notification phase is enabled.
profileRouter.post(
  '/push-token',
  validate({ body: pushTokenBody }),
  asyncHandler(async (req, res) => {
    const { expo_push_token } = body<typeof pushTokenBody>(req);
    unwrap(
      await supabaseAdmin
        .from('profiles')
        .update({ expo_push_token })
        .eq('id', profileOf(req).id)
        .select('id')
        .single()
    );
    res.status(204).end();
  })
);
