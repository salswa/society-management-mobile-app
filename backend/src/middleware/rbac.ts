import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../types/database.types';
import { forbidden, unauthorized } from '../lib/errors';

/** Guards a route so only the given roles may proceed. Must run after `authenticate`. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.profile.role)) {
      return next(forbidden(`Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

/** Requires the caller's account to be active (not pending onboarding). */
export function requireActive(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(unauthorized());
  if (req.auth.profile.status !== 'active') {
    return next(forbidden('Your account is pending approval by the society admin'));
  }
  next();
}
