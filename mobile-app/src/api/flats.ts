import { apiRequest } from './client';
import type { Flat } from './types';

export type FlatInput = { tower_id: string; number: string; floor?: number };

export const flatsApi = {
  /** Society flats, optionally filtered by tower. Used by the admin flat picker. */
  list: (tower_id?: string) =>
    apiRequest<{ flats: Flat[] }>('/flats', { query: tower_id ? { tower_id } : {} }),

  create: (input: FlatInput) =>
    apiRequest<{ flat: Flat }>('/flats', { method: 'POST', body: input }),

  update: (id: string, input: { number?: string; floor?: number }) =>
    apiRequest<{ flat: Flat }>(`/flats/${id}`, { method: 'PATCH', body: input }),

  remove: (id: string) => apiRequest<void>(`/flats/${id}`, { method: 'DELETE' }),
};
