import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { visitorsApi, type CreateVisitorInput, type VisitorFilters } from '@/api/visitors';
import { noticesApi, type CreateNoticeInput } from '@/api/notices';
import { residentsApi } from '@/api/residents';
import { profileApi } from '@/api/profile';

// --- Query keys -------------------------------------------------------------
export const keys = {
  myProfile: () => ['profile', 'me'] as const,
  visitors: (filters?: VisitorFilters) => ['visitors', filters ?? {}] as const,
  visitorHistory: (filters?: VisitorFilters) => ['visitors', 'history', filters ?? {}] as const,
  visitor: (id: string) => ['visitor', id] as const,
  notices: () => ['notices'] as const,
  notice: (id: string) => ['notice', id] as const,
  residentSearch: (q: string) => ['residents', 'search', q] as const,
};

// --- Profile ----------------------------------------------------------------
export function useMyProfile() {
  return useQuery({
    queryKey: keys.myProfile(),
    queryFn: () => profileApi.me(),
  });
}

/** Invalidate every visitor list and detail after a mutation. */
function useInvalidateVisitors() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['visitors'] });
    qc.invalidateQueries({ queryKey: ['visitor'] });
  };
}

// --- Visitors ---------------------------------------------------------------
export function useVisitors(filters: VisitorFilters = {}) {
  return useQuery({
    queryKey: keys.visitors(filters),
    queryFn: () => visitorsApi.list(filters).then((r) => r.visitors),
  });
}

export function useVisitorHistory(filters: VisitorFilters = {}) {
  return useQuery({
    queryKey: keys.visitorHistory(filters),
    queryFn: () => visitorsApi.history(filters).then((r) => r.visitors),
  });
}

export function useVisitor(id: string) {
  return useQuery({
    queryKey: keys.visitor(id),
    queryFn: () => visitorsApi.get(id).then((r) => r.visitor),
    enabled: !!id,
  });
}

export function useCreateVisitor() {
  const invalidate = useInvalidateVisitors();
  return useMutation({
    mutationFn: (input: CreateVisitorInput) => visitorsApi.create(input).then((r) => r.visitor),
    onSuccess: invalidate,
  });
}

type VisitorAction = 'approve' | 'reject' | 'checkIn' | 'checkOut';

export function useVisitorAction() {
  const invalidate = useInvalidateVisitors();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: VisitorAction }) =>
      visitorsApi[action](id).then((r) => r.visitor),
    onSuccess: invalidate,
  });
}

// --- Notices ----------------------------------------------------------------
export function useNotices() {
  return useQuery({
    queryKey: keys.notices(),
    queryFn: () => noticesApi.list().then((r) => r.notices),
  });
}

export function useNotice(id: string) {
  return useQuery({
    queryKey: keys.notice(id),
    queryFn: () => noticesApi.get(id).then((r) => r.notice),
    enabled: !!id,
  });
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoticeInput) => noticesApi.create(input).then((r) => r.notice),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notices() }),
  });
}

// --- Resident search (guard) ------------------------------------------------
export function useResidentSearch(q: string) {
  return useQuery({
    queryKey: keys.residentSearch(q),
    queryFn: () => residentsApi.search(q),
    enabled: q.trim().length > 0,
  });
}
