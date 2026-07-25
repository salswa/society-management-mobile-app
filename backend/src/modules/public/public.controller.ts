import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { validate, query } from '../../middleware/validate';
import { supabaseAdmin } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { uuidSchema } from '../../lib/validators';

/**
 * Unauthenticated lookups used by the sign-up screen so a new user can pick
 * their society → tower → (free) flat before they have an account.
 */
export const publicRouter = Router();

const towersQuery = z.object({ society_id: uuidSchema });
const flatsQuery = z.object({ tower_id: uuidSchema });

publicRouter.get(
  '/societies',
  asyncHandler(async (_req, res) => {
    const societies = unwrap(
      await supabaseAdmin.from('societies').select('id, name').order('name')
    );
    res.json({ societies });
  })
);

publicRouter.get(
  '/towers',
  validate({ query: towersQuery }),
  asyncHandler(async (req, res) => {
    const { society_id } = query<typeof towersQuery>(req);
    // Only offer towers that still have at least one unoccupied flat.
    const flats = unwrap(
      await supabaseAdmin
        .from('flats')
        .select('tower_id, flat_residents(profile_id)')
        .eq('society_id', society_id)
    );
    const freeTowerIds = new Set(
      flats.filter((f) => (f.flat_residents?.length ?? 0) === 0).map((f) => f.tower_id)
    );
    const allTowers = unwrap(
      await supabaseAdmin.from('towers').select('id, name').eq('society_id', society_id).order('name')
    );
    res.json({ towers: allTowers.filter((t) => freeTowerIds.has(t.id)) });
  })
);

publicRouter.get(
  '/flats',
  validate({ query: flatsQuery }),
  asyncHandler(async (req, res) => {
    const { tower_id } = query<typeof flatsQuery>(req);
    // Only unoccupied flats (no flat_residents row) are offered at registration.
    const rows = unwrap(
      await supabaseAdmin
        .from('flats')
        .select('id, number, floor, flat_residents(profile_id)')
        .eq('tower_id', tower_id)
        .order('number')
    );
    const flats = rows
      .filter((f) => (f.flat_residents?.length ?? 0) === 0)
      .map(({ id, number, floor }) => ({ id, number, floor }));
    res.json({ flats });
  })
);
