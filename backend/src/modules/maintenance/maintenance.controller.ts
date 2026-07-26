import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params, query } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { profileOf, societyIdOf } from '../../lib/context';
import { notifyDues } from '../../lib/push';
import { idParam, uuidSchema } from '../../lib/validators';
import type { MaintenanceInvoice } from '../../types/database.types';

const createBody = z.object({
  flat_id: uuidSchema,
  period: z.string().trim().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM'),
  amount: z.coerce.number().positive(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional(),
});

const listQuery = z.object({
  status: z.enum(['pending', 'paid']).optional(),
  flat_id: uuidSchema.optional(),
});

export const maintenanceRouter = Router();
maintenanceRouter.use(authenticate);

maintenanceRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const me = profileOf(req);
    const { status, flat_id } = query<typeof listQuery>(req);

    let q = supabaseAdmin
      .from('maintenance_invoices')
      .select('*, flat:flats(id, number, tower:towers(name))')
      .eq('society_id', societyIdOf(req))
      .order('period', { ascending: false });

    if (me.role === 'resident') {
      const flats = unwrap(
        await supabaseAdmin.from('flat_residents').select('flat_id').eq('profile_id', me.id)
      );
      const flatIds = flats.map((f) => f.flat_id);
      if (flatIds.length === 0) return res.json({ invoices: [] });
      q = q.in('flat_id', flatIds);
    } else if (flat_id) {
      q = q.eq('flat_id', flat_id);
    }
    if (status) q = q.eq('status', status);

    res.json({ invoices: unwrap(await q) });
  })
);

maintenanceRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const input = body<typeof createBody>(req);
    const invoice: MaintenanceInvoice = unwrap(
      await supabaseAdmin
        .from('maintenance_invoices')
        .insert({
          society_id: societyIdOf(req),
          flat_id: input.flat_id,
          period: input.period,
          amount: input.amount,
          due_date: input.due_date ?? null,
        })
        .select('*')
        .single()
    );
    await notifyDues(invoice.flat_id, invoice.amount, invoice.period, invoice.id);
    res.status(201).json({ invoice });
  })
);

// No payment gateway — admin records a manual payment.
maintenanceRouter.post(
  '/:id/mark-paid',
  requireRole('admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const invoice: MaintenanceInvoice = unwrap(
      await supabaseAdmin
        .from('maintenance_invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('*')
        .single()
    );
    await notifyDues(invoice.flat_id, invoice.amount, invoice.period, invoice.id, true);
    res.json({ invoice });
  })
);
