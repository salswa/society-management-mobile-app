import { apiRequest } from './client';
import type { Profile, Session } from './types';

export type AuthResult = { profile: Profile; session: Session };

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResult>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),

  register: (input: { email: string; password: string; name: string; phone?: string }) =>
    apiRequest<AuthResult>('/auth/register', {
      method: 'POST',
      body: input,
      auth: false,
    }),

  me: () => apiRequest<{ profile: Profile }>('/auth/me'),

  refresh: (refresh_token: string) =>
    apiRequest<{ session: Session }>('/auth/refresh', {
      method: 'POST',
      body: { refresh_token },
      auth: false,
    }),

  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
};
