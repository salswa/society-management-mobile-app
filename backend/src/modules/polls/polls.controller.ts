import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { badRequest } from '../../lib/errors';
import { profileOf, societyIdOf } from '../../lib/context';
import { idParam, uuidSchema } from '../../lib/validators';
import type { Poll } from '../../types/database.types';
import * as service from './polls.service';

const createBody = z.object({
  question: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  is_multi: z.boolean().default(false),
  closes_at: z.string().datetime().optional(),
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(10),
});

const voteBody = z.object({ option_ids: z.array(uuidSchema).min(1) });

export const pollsRouter = Router();
pollsRouter.use(authenticate);

pollsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const polls = unwrap(
      await supabaseAdmin
        .from('polls')
        .select('*, options:poll_options(id, text, position)')
        .eq('society_id', societyIdOf(req))
        .order('created_at', { ascending: false })
    );
    res.json({ polls });
  })
);

pollsRouter.get(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const id = params<typeof idParam>(req).id;
    const poll = unwrap(
      await supabaseAdmin
        .from('polls')
        .select('*, options:poll_options(id, text, position)')
        .eq('id', id)
        .eq('society_id', societyIdOf(req))
        .single()
    );
    const myVotes = unwrap(
      await supabaseAdmin
        .from('poll_votes')
        .select('option_id')
        .eq('poll_id', id)
        .eq('profile_id', profileOf(req).id)
    );
    res.json({ poll, my_votes: myVotes.map((v) => v.option_id) });
  })
);

pollsRouter.get(
  '/:id/results',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const data = await service.results(params<typeof idParam>(req).id, societyIdOf(req));
    res.json(data);
  })
);

pollsRouter.post(
  '/:id/vote',
  validate({ params: idParam, body: voteBody }),
  asyncHandler(async (req, res) => {
    await service.vote({
      pollId: params<typeof idParam>(req).id,
      societyId: societyIdOf(req),
      profileId: profileOf(req).id,
      optionIds: body<typeof voteBody>(req).option_ids,
    });
    res.status(204).end();
  })
);

// --- Admin ------------------------------------------------------------------
pollsRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const input = body<typeof createBody>(req);
    const poll: Poll = unwrap(
      await supabaseAdmin
        .from('polls')
        .insert({
          society_id: societyIdOf(req),
          created_by: profileOf(req).id,
          question: input.question,
          description: input.description ?? null,
          is_multi: input.is_multi,
          closes_at: input.closes_at ?? null,
        })
        .select('*')
        .single()
    );

    const optionsResult = await supabaseAdmin
      .from('poll_options')
      .insert(input.options.map((text, position) => ({ poll_id: poll.id, text, position })))
      .select('*');
    if (optionsResult.error) {
      await supabaseAdmin.from('polls').delete().eq('id', poll.id);
      throw badRequest('Failed to create poll options');
    }

    res.status(201).json({ poll: { ...poll, options: optionsResult.data } });
  })
);

pollsRouter.post(
  '/:id/close',
  requireRole('admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const poll = unwrap(
      await supabaseAdmin
        .from('polls')
        .update({ status: 'closed' })
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('*')
        .single()
    );
    res.json({ poll });
  })
);
