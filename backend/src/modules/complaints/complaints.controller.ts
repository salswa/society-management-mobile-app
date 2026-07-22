import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params, query } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { forbidden } from '../../lib/errors';
import { profileOf, societyIdOf } from '../../lib/context';
import { idParam, paginationSchema, uuidSchema } from '../../lib/validators';
import type { Complaint } from '../../types/database.types';

const createBody = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(40).default('general'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  flat_id: uuidSchema.optional(),
});

const listQuery = paginationSchema.extend({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  scope: z.enum(['mine', 'all']).default('mine'),
});

const patchBody = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  assigned_to: uuidSchema.nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

const commentBody = z.object({ body: z.string().trim().min(1).max(1000) });

const SELECT =
  '*, raised_by_profile:profiles!complaints_raised_by_fkey(id, name), assignee:profiles!complaints_assigned_to_fkey(id, name)';

export const complaintsRouter = Router();
complaintsRouter.use(authenticate);

complaintsRouter.post(
  '/',
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const input = body<typeof createBody>(req);
    const complaint = unwrap(
      await supabaseAdmin
        .from('complaints')
        .insert({
          society_id: societyIdOf(req),
          raised_by: profileOf(req).id,
          title: input.title,
          description: input.description ?? null,
          category: input.category,
          priority: input.priority,
          flat_id: input.flat_id ?? null,
        })
        .select(SELECT)
        .single()
    );
    res.status(201).json({ complaint });
  })
);

complaintsRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { status, scope, limit, offset } = query<typeof listQuery>(req);
    const me = profileOf(req);

    let q = supabaseAdmin
      .from('complaints')
      .select(SELECT)
      .eq('society_id', societyIdOf(req))
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Residents always see only their own; admins can request the full list.
    if (me.role !== 'admin' || scope === 'mine') q = q.eq('raised_by', me.id);
    if (status) q = q.eq('status', status);

    res.json({ complaints: unwrap(await q) });
  })
);

complaintsRouter.get(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const me = profileOf(req);
    const complaint: Complaint = unwrap(
      await supabaseAdmin
        .from('complaints')
        .select(`${SELECT}, comments:complaint_comments(id, body, created_at, author:profiles(id, name))`)
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .single()
    );
    if (me.role !== 'admin' && complaint.raised_by !== me.id) throw forbidden('Not your complaint');
    res.json({ complaint });
  })
);

// Admin updates status / assignment / priority.
complaintsRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam, body: patchBody }),
  asyncHandler(async (req, res) => {
    const complaint = unwrap(
      await supabaseAdmin
        .from('complaints')
        .update(body<typeof patchBody>(req))
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select(SELECT)
        .single()
    );
    res.json({ complaint });
  })
);

// Resident (owner) or admin adds a comment.
complaintsRouter.post(
  '/:id/comments',
  validate({ params: idParam, body: commentBody }),
  asyncHandler(async (req, res) => {
    const me = profileOf(req);
    const id = params<typeof idParam>(req).id;
    const complaint: Pick<Complaint, 'id' | 'raised_by'> = unwrap(
      await supabaseAdmin
        .from('complaints')
        .select('id, raised_by')
        .eq('id', id)
        .eq('society_id', societyIdOf(req))
        .single()
    );
    if (me.role !== 'admin' && complaint.raised_by !== me.id) throw forbidden('Not your complaint');

    const comment = unwrap(
      await supabaseAdmin
        .from('complaint_comments')
        .insert({ complaint_id: id, author_id: me.id, body: body<typeof commentBody>(req).body })
        .select('id, body, created_at, author:profiles(id, name)')
        .single()
    );
    res.status(201).json({ comment });
  })
);
