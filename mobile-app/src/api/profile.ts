import { apiRequest } from './client';
import type { FlatRef, Profile } from './types';

export type MyFlat = {
  is_owner: boolean;
  is_primary: boolean;
  flat: FlatRef | null;
};

export const profileApi = {
  /** Current profile plus the caller's flat memberships. */
  me: () => apiRequest<{ profile: Profile; flats: MyFlat[] }>('/profile'),
};
