import { apiRequest } from './client';

export type PublicSociety = { id: string; name: string };
export type PublicTower = { id: string; name: string };
export type PublicFlat = { id: string; number: string; floor: number | null };

/** Unauthenticated lookups for the sign-up screen (society → tower → free flat). */
export const publicApi = {
  societies: () =>
    apiRequest<{ societies: PublicSociety[] }>('/public/societies', { auth: false }),

  towers: (society_id: string) =>
    apiRequest<{ towers: PublicTower[] }>('/public/towers', { query: { society_id }, auth: false }),

  flats: (tower_id: string) =>
    apiRequest<{ flats: PublicFlat[] }>('/public/flats', { query: { tower_id }, auth: false }),
};
