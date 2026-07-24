import { apiRequest } from './client';
import type { Flat } from './types';

export const flatsApi = {
  /** Society flats, optionally filtered by tower. Used by the admin flat picker. */
  list: (tower_id?: string) =>
    apiRequest<{ flats: Flat[] }>('/flats', { query: tower_id ? { tower_id } : {} }),
};
