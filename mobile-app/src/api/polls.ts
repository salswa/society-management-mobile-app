import { apiRequest } from './client';
import type { Poll, PollResults } from './types';

export type CreatePollInput = {
  question: string;
  description?: string;
  is_multi: boolean;
  closes_at?: string;
  options: string[];
};

export const pollsApi = {
  list: () => apiRequest<{ polls: Poll[] }>('/polls'),

  get: (id: string) => apiRequest<{ poll: Poll; my_votes: string[] }>(`/polls/${id}`),

  results: (id: string) => apiRequest<PollResults>(`/polls/${id}/results`),

  create: (input: CreatePollInput) =>
    apiRequest<{ poll: Poll }>('/polls', { method: 'POST', body: input }),

  vote: (id: string, option_ids: string[]) =>
    apiRequest<void>(`/polls/${id}/vote`, { method: 'POST', body: { option_ids } }),

  close: (id: string) => apiRequest<{ poll: Poll }>(`/polls/${id}/close`, { method: 'POST' }),
};
