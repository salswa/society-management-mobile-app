import { apiRequest } from './client';
import type { Profile, Session, UserType } from './types';

export type AuthResult = { profile: Profile; session: Session };

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
  society_id: string;
  user_type: UserType;
  flat_id?: string;
};

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResult>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),

  register: (input: RegisterInput) =>
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
