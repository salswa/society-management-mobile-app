import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params, query } from '../../middleware/validate';
import { profileOf, societyIdOf } from '../../lib/context';
import { idParam, paginationSchema, uuidSchema } from '../../lib/validators';
import * as service from './visitors.service';

const visitorType = z.enum(['guest', 'delivery', 'cab', 'service']);

const createBody = z.object({
  flat_id: uuidSchema,
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(20).optional(),
  type: visitorType.optional(),
  purpose: z.string().trim().max(200).optional(),
  vehicle_no: z.string().trim().max(20).optional(),
  photo_url: z.string().url().optional(),
  expected_at: z.string().datetime().optional(),
});

const listQuery = paginationSchema.extend({
  status: z
    .enum(['pending', 'approved', 'rejected', 'expired', 'checked_in', 'checked_out'])
    .optional(),
  type: visitorType.optional(),
  flat_id: uuidSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  // Scope to the caller's own flats regardless of role (used by an admin
  // viewing the resident experience). Residents are already flat-scoped.
  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const visitorsRouter = Router();
visitorsRouter.use(authenticate);

// Guard registers an arriving visitor; resident/admin pre-approves an expected one.
visitorsRouter.post(
  '/',
  requireRole('resident', 'guard', 'admin'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    const visitor = await service.createVisitor(profileOf(req), body<typeof createBody>(req));
    res.status(201).json({ visitor });
  })
);

visitorsRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const visitors = await service.listVisitors(profileOf(req), query<typeof listQuery>(req));
    res.json({ visitors });
  })
);

// Completed visits (checked-out) — the entry/exit history log.
visitorsRouter.get(
  '/history',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const visitors = await service.listVisitors(profileOf(req), {
      ...query<typeof listQuery>(req),
      status: 'checked_out',
    });
    res.json({ visitors });
  })
);

visitorsRouter.get(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const visitor = await service.getVisitor(profileOf(req), params<typeof idParam>(req).id);
    res.json({ visitor });
  })
);

visitorsRouter.post(
  '/:id/approve',
  requireRole('resident', 'admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const visitor = await service.decide(profileOf(req), params<typeof idParam>(req).id, 'approved');
    res.json({ visitor });
  })
);

visitorsRouter.post(
  '/:id/reject',
  requireRole('resident', 'admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const visitor = await service.decide(profileOf(req), params<typeof idParam>(req).id, 'rejected');
    res.json({ visitor });
  })
);

visitorsRouter.post(
  '/:id/check-in',
  requireRole('guard', 'admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const visitor = await service.checkIn(params<typeof idParam>(req).id, societyIdOf(req));
    res.json({ visitor });
  })
);

visitorsRouter.post(
  '/:id/check-out',
  requireRole('guard', 'admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const visitor = await service.checkOut(params<typeof idParam>(req).id, societyIdOf(req));
    res.json({ visitor });
  })
);
