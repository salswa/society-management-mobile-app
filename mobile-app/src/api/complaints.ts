import { apiRequest } from './client';
import type { Complaint, ComplaintComment, ComplaintPriority, ComplaintStatus } from './types';

export type ComplaintFilters = { status?: ComplaintStatus; scope?: 'mine' | 'all' };

export type CreateComplaintInput = {
  title: string;
  description?: string;
  category?: string;
  priority?: ComplaintPriority;
  flat_id?: string;
};

export type PatchComplaintInput = {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assigned_to?: string | null;
};

export const complaintsApi = {
  list: (filters: ComplaintFilters = {}) =>
    apiRequest<{ complaints: Complaint[] }>('/complaints', { query: filters }),

  get: (id: string) => apiRequest<{ complaint: Complaint }>(`/complaints/${id}`),

  create: (input: CreateComplaintInput) =>
    apiRequest<{ complaint: Complaint }>('/complaints', { method: 'POST', body: input }),

  patch: (id: string, input: PatchComplaintInput) =>
    apiRequest<{ complaint: Complaint }>(`/complaints/${id}`, { method: 'PATCH', body: input }),

  addComment: (id: string, body: string) =>
    apiRequest<{ comment: ComplaintComment }>(`/complaints/${id}/comments`, {
      method: 'POST',
      body: { body },
    }),
};
