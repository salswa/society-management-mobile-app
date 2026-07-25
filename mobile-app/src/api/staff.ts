import { apiRequest } from './client';
import type { StaffKind, StaffMember } from './types';

export type StaffInput = {
  name: string;
  kind: StaffKind;
  category?: string;
  phone?: string;
  company?: string;
};

export const staffApi = {
  list: (kind?: StaffKind) =>
    apiRequest<{ staff: StaffMember[] }>('/staff', { query: kind ? { kind } : {} }),

  create: (input: StaffInput) =>
    apiRequest<{ staff: StaffMember }>('/staff', { method: 'POST', body: input }),

  update: (id: string, input: Partial<StaffInput>) =>
    apiRequest<{ staff: StaffMember }>(`/staff/${id}`, { method: 'PATCH', body: input }),

  remove: (id: string) => apiRequest<void>(`/staff/${id}`, { method: 'DELETE' }),
};
