import { apiRequest } from './client';
import type { Notice } from './types';

export type CreateNoticeInput = {
  title: string;
  body: string;
  category?: string;
  is_pinned?: boolean;
};

export const noticesApi = {
  list: () => apiRequest<{ notices: Notice[] }>('/notices'),
  get: (id: string) => apiRequest<{ notice: Notice }>(`/notices/${id}`),
  create: (input: CreateNoticeInput) =>
    apiRequest<{ notice: Notice }>('/notices', { method: 'POST', body: input }),
};
