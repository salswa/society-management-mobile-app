import { apiRequest } from './client';
import type { Member, ResidentSearchResult, Role, UserStatus } from './types';

export type ResidentListFilters = {
  role?: Role;
  status?: UserStatus;
};

export const residentsApi = {
  /** Guard/admin search across residents (name/phone) and flats (number). */
  search: (q: string) =>
    apiRequest<ResidentSearchResult>('/residents/search', { query: { q } }),

  /** Admin: list society members (+ unassigned pending sign-ups under status=pending). */
  list: (filters: ResidentListFilters = {}) =>
    apiRequest<{ residents: Member[] }>('/residents', { query: filters }),

  /** Admin: approve a pending sign-up, optionally linking a flat. */
  approve: (id: string, flat_id?: string) =>
    apiRequest<{ resident: Member }>(`/residents/${id}/approve`, {
      method: 'POST',
      body: flat_id ? { flat_id } : {},
    }),

  /** Admin: enable/disable an account. */
  setStatus: (id: string, status: 'active' | 'disabled') =>
    apiRequest<{ resident: Member }>(`/residents/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  /** Admin: link a member to a flat (assign / change). */
  assignFlat: (id: string, flat_id: string, is_primary = true) =>
    apiRequest<void>(`/residents/${id}/flats`, {
      method: 'POST',
      body: { flat_id, is_primary },
    }),

  /** Admin: reject a pending sign-up or remove a member. */
  remove: (id: string) => apiRequest<void>(`/residents/${id}`, { method: 'DELETE' }),
};
