import type { Profile } from './database.types';

declare global {
  namespace Express {
    interface Request {
      /** Populated by the `authenticate` middleware. */
      auth?: {
        userId: string;
        token: string;
        profile: Profile;
      };
    }
  }
}

export {};
