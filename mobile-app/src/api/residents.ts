import { apiRequest } from './client';
import type { ResidentSearchResult } from './types';

export const residentsApi = {
  /** Guard/admin search across residents (name/phone) and flats (number). */
  search: (q: string) =>
    apiRequest<ResidentSearchResult>('/residents/search', { query: { q } }),
};
