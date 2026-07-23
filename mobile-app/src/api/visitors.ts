import { apiRequest } from './client';
import type { Visitor, VisitorStatus, VisitorType } from './types';

export type VisitorFilters = {
  status?: VisitorStatus;
  type?: VisitorType;
  flat_id?: string;
  limit?: number;
  offset?: number;
};

export type CreateVisitorInput = {
  flat_id: string;
  name: string;
  phone?: string;
  type?: VisitorType;
  purpose?: string;
  vehicle_no?: string;
  expected_at?: string;
};

export const visitorsApi = {
  list: (filters: VisitorFilters = {}) =>
    apiRequest<{ visitors: Visitor[] }>('/visitors', { query: filters }),

  history: (filters: VisitorFilters = {}) =>
    apiRequest<{ visitors: Visitor[] }>('/visitors/history', { query: filters }),

  get: (id: string) => apiRequest<{ visitor: Visitor }>(`/visitors/${id}`),

  create: (input: CreateVisitorInput) =>
    apiRequest<{ visitor: Visitor }>('/visitors', { method: 'POST', body: input }),

  approve: (id: string) =>
    apiRequest<{ visitor: Visitor }>(`/visitors/${id}/approve`, { method: 'POST' }),

  reject: (id: string) =>
    apiRequest<{ visitor: Visitor }>(`/visitors/${id}/reject`, { method: 'POST' }),

  checkIn: (id: string) =>
    apiRequest<{ visitor: Visitor }>(`/visitors/${id}/check-in`, { method: 'POST' }),

  checkOut: (id: string) =>
    apiRequest<{ visitor: Visitor }>(`/visitors/${id}/check-out`, { method: 'POST' }),
};
