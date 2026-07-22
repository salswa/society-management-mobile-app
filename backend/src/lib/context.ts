import type { Request } from 'express';
import { badRequest } from './errors';
import type { Profile } from '../types/database.types';

/** The authenticated profile (asserts `authenticate` ran first). */
export function profileOf(req: Request): Profile {
  return req.auth!.profile;
}

/** The caller's society id, or a 400 if their account isn't attached to one yet. */
export function societyIdOf(req: Request): string {
  const id = req.auth!.profile.society_id;
  if (!id) {
    throw badRequest('Your account is not linked to a society yet. Ask your admin to assign you.');
  }
  return id;
}
