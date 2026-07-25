import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { validate, body, params, query } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { conflict, forbidden, notFound } from '../../lib/errors';
import { profileOf, societyIdOf } from '../../lib/context';
import { idParam, paginationSchema, uuidSchema } from '../../lib/validators';
import type { Amenity, AmenityBooking } from '../../types/database.types';

const timeStr = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM');

const createAmenityBody = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500).optional(),
  capacity: z.coerce.number().int().min(1).default(1),
  open_time: timeStr.default('06:00'),
  close_time: timeStr.default('22:00'),
  slot_minutes: z.coerce.number().int().min(15).max(1440).default(60),
  is_active: z.boolean().default(true),
});

const updateAmenityBody = createAmenityBody.partial();

const bookingBody = z.object({
  amenity_id: uuidSchema,
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  flat_id: uuidSchema.optional(),
});

const availabilityQuery = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const amenitiesRouter = Router();
amenitiesRouter.use(authenticate);

// --- Amenities --------------------------------------------------------------
amenitiesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = unwrap(
      await supabaseAdmin
        .from('amenities')
        .select('*')
        .eq('society_id', societyIdOf(req))
        .order('name')
    );
    res.json({ amenities: rows });
  })
);

amenitiesRouter.get(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const amenity = unwrap(
      await supabaseAdmin
        .from('amenities')
        .select('*')
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .single()
    );
    res.json({ amenity });
  })
);

// Existing bookings in a window (for the app to render availability).
amenitiesRouter.get(
  '/:id/availability',
  validate({ params: idParam, query: availabilityQuery }),
  asyncHandler(async (req, res) => {
    const { from, to } = query<typeof availabilityQuery>(req);
    const bookings = unwrap(
      await supabaseAdmin
        .from('amenity_bookings')
        .select('id, start_time, end_time, status')
        .eq('amenity_id', params<typeof idParam>(req).id)
        .eq('status', 'booked')
        .lt('start_time', to)
        .gt('end_time', from)
        .order('start_time')
    );
    res.json({ bookings });
  })
);

// Admin: upcoming bookings for an amenity, with the booker and their flat.
amenitiesRouter.get(
  '/:id/bookings',
  requireRole('admin'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const id = params<typeof idParam>(req).id;
    // Scope: the amenity must belong to the admin's society.
    unwrap(
      await supabaseAdmin
        .from('amenities')
        .select('id')
        .eq('id', id)
        .eq('society_id', societyIdOf(req))
        .single()
    );
    const bookings = unwrap(
      await supabaseAdmin
        .from('amenity_bookings')
        .select(
          'id, start_time, end_time, status, profile:profiles(id, name), flat:flats(id, number, tower:towers(name))'
        )
        .eq('amenity_id', id)
        .eq('status', 'booked')
        .gte('end_time', new Date().toISOString())
        .order('start_time')
    );
    res.json({ bookings });
  })
);

amenitiesRouter.post(
  '/',
  requireRole('admin'),
  validate({ body: createAmenityBody }),
  asyncHandler(async (req, res) => {
    const amenity = unwrap(
      await supabaseAdmin
        .from('amenities')
        .insert({ society_id: societyIdOf(req), ...body<typeof createAmenityBody>(req) })
        .select('*')
        .single()
    );
    res.status(201).json({ amenity });
  })
);

amenitiesRouter.patch(
  '/:id',
  requireRole('admin'),
  validate({ params: idParam, body: updateAmenityBody }),
  asyncHandler(async (req, res) => {
    const amenity = unwrap(
      await supabaseAdmin
        .from('amenities')
        .update(body<typeof updateAmenityBody>(req))
        .eq('id', params<typeof idParam>(req).id)
        .eq('society_id', societyIdOf(req))
        .select('*')
        .single()
    );
    res.json({ amenity });
  })
);

// --- Bookings ---------------------------------------------------------------
export const bookingsRouter = Router();
bookingsRouter.use(authenticate);

bookingsRouter.get(
  '/',
  validate({ query: paginationSchema }),
  asyncHandler(async (req, res) => {
    const { limit, offset } = query<typeof paginationSchema>(req);
    const rows = unwrap(
      await supabaseAdmin
        .from('amenity_bookings')
        .select('*, amenity:amenities(id, name)')
        .eq('profile_id', profileOf(req).id)
        .order('start_time', { ascending: false })
        .range(offset, offset + limit - 1)
    );
    res.json({ bookings: rows });
  })
);

bookingsRouter.post(
  '/',
  validate({ body: bookingBody }),
  asyncHandler(async (req, res) => {
    const input = body<typeof bookingBody>(req);
    if (new Date(input.end_time) <= new Date(input.start_time)) {
      throw conflict('End time must be after start time');
    }

    const amenity: Amenity = unwrap(
      await supabaseAdmin
        .from('amenities')
        .select('*')
        .eq('id', input.amenity_id)
        .eq('society_id', societyIdOf(req))
        .single()
    );
    if (!amenity.is_active) throw notFound('Amenity is not available for booking');

    // Reject if the overlapping booked count has reached capacity.
    const overlapping = unwrap(
      await supabaseAdmin
        .from('amenity_bookings')
        .select('id')
        .eq('amenity_id', input.amenity_id)
        .eq('status', 'booked')
        .lt('start_time', input.end_time)
        .gt('end_time', input.start_time)
    );
    if (overlapping.length >= amenity.capacity) {
      throw conflict('This slot is already fully booked');
    }

    const booking = unwrap(
      await supabaseAdmin
        .from('amenity_bookings')
        .insert({
          amenity_id: input.amenity_id,
          profile_id: profileOf(req).id,
          flat_id: input.flat_id ?? null,
          start_time: input.start_time,
          end_time: input.end_time,
        })
        .select('*, amenity:amenities(id, name)')
        .single()
    );
    res.status(201).json({ booking });
  })
);

bookingsRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const me = profileOf(req);
    const existing: Pick<AmenityBooking, 'id' | 'profile_id'> = unwrap(
      await supabaseAdmin
        .from('amenity_bookings')
        .select('id, profile_id')
        .eq('id', params<typeof idParam>(req).id)
        .single()
    );
    if (existing.profile_id !== me.id && me.role !== 'admin') {
      throw forbidden('Not your booking');
    }
    unwrap(
      await supabaseAdmin
        .from('amenity_bookings')
        .update({ status: 'cancelled' })
        .eq('id', existing.id)
        .select('id')
        .single()
    );
    res.status(204).end();
  })
);
