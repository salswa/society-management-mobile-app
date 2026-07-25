import { apiRequest } from './client';
import type { Tower } from './types';

export const towersApi = {
  list: () => apiRequest<{ towers: Tower[] }>('/towers'),

  create: (name: string) =>
    apiRequest<{ tower: Tower }>('/towers', { method: 'POST', body: { name } }),

  update: (id: string, name: string) =>
    apiRequest<{ tower: Tower }>(`/towers/${id}`, { method: 'PATCH', body: { name } }),

  remove: (id: string) => apiRequest<void>(`/towers/${id}`, { method: 'DELETE' }),
};
