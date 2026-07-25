import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { visitorsApi, type CreateVisitorInput, type VisitorFilters } from '@/api/visitors';
import { noticesApi, type CreateNoticeInput } from '@/api/notices';
import { residentsApi, type ApproveInput, type ResidentListFilters } from '@/api/residents';
import type { Role } from '@/api/types';
import { flatsApi, type FlatInput } from '@/api/flats';
import { towersApi } from '@/api/towers';
import { staffApi, type StaffInput } from '@/api/staff';
import {
  complaintsApi,
  type ComplaintFilters,
  type CreateComplaintInput,
  type PatchComplaintInput,
} from '@/api/complaints';
import {
  maintenanceApi,
  type CreateInvoiceInput,
  type InvoiceFilters,
} from '@/api/maintenance';
import { pollsApi, type CreatePollInput } from '@/api/polls';
import {
  amenitiesApi,
  bookingsApi,
  type AmenityInput,
  type BookingInput,
} from '@/api/amenities';
import type { StaffKind } from '@/api/types';
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
  residents: (filters?: ResidentListFilters) => ['residents', 'list', filters ?? {}] as const,
  flats: () => ['flats'] as const,
  towers: () => ['towers'] as const,
  staff: (kind?: StaffKind) => ['staff', kind ?? 'all'] as const,
  complaints: (filters?: ComplaintFilters) => ['complaints', filters ?? {}] as const,
  complaint: (id: string) => ['complaint', id] as const,
  invoices: (filters?: InvoiceFilters) => ['invoices', filters ?? {}] as const,
  polls: () => ['polls'] as const,
  poll: (id: string) => ['poll', id] as const,
  pollResults: (id: string) => ['poll', id, 'results'] as const,
  amenities: () => ['amenities'] as const,
  amenity: (id: string) => ['amenity', id] as const,
  availability: (id: string, from: string, to: string) =>
    ['availability', id, from, to] as const,
  amenityBookings: (id: string) => ['amenity', id, 'bookings'] as const,
  bookings: () => ['bookings'] as const,
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

// --- Members & flats (admin) ------------------------------------------------
export function useResidents(filters: ResidentListFilters = {}) {
  return useQuery({
    queryKey: keys.residents(filters),
    queryFn: () => residentsApi.list(filters).then((r) => r.residents),
  });
}

export function useFlats() {
  return useQuery({
    queryKey: keys.flats(),
    queryFn: () => flatsApi.list().then((r) => r.flats),
  });
}

/** Invalidate every members list after a mutation. */
function useInvalidateResidents() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['residents'] });
}

export function useApproveResident() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApproveInput }) =>
      residentsApi.approve(id, input),
    onSuccess: invalidate,
  });
}

export function useSetResidentRole() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => residentsApi.setRole(id, role),
    onSuccess: invalidate,
  });
}

export function useSetResidentStatus() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'disabled' }) =>
      residentsApi.setStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useAssignResidentFlat() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: ({ id, flatId }: { id: string; flatId: string }) =>
      residentsApi.assignFlat(id, flatId),
    onSuccess: invalidate,
  });
}

export function useDeleteResident() {
  const invalidate = useInvalidateResidents();
  return useMutation({
    mutationFn: (id: string) => residentsApi.remove(id),
    onSuccess: invalidate,
  });
}

// --- Towers & flats CRUD (admin) --------------------------------------------
export function useTowers() {
  return useQuery({
    queryKey: keys.towers(),
    queryFn: () => towersApi.list().then((r) => r.towers),
  });
}

/** Towers and flats are interdependent (deleting a tower cascades its flats). */
function useInvalidateProperty() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['towers'] });
    qc.invalidateQueries({ queryKey: ['flats'] });
  };
}

export function useCreateTower() {
  const invalidate = useInvalidateProperty();
  return useMutation({
    mutationFn: (name: string) => towersApi.create(name),
    onSuccess: invalidate,
  });
}

export function useUpdateTower() {
  const invalidate = useInvalidateProperty();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => towersApi.update(id, name),
    onSuccess: invalidate,
  });
}

export function useDeleteTower() {
  const invalidate = useInvalidateProperty();
  return useMutation({
    mutationFn: (id: string) => towersApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useCreateFlat() {
  const invalidate = useInvalidateProperty();
  return useMutation({
    mutationFn: (input: FlatInput) => flatsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateFlat() {
  const invalidate = useInvalidateProperty();
  return useMutation({
    mutationFn: ({ id, number, floor }: { id: string; number?: string; floor?: number }) =>
      flatsApi.update(id, { number, floor }),
    onSuccess: invalidate,
  });
}

export function useDeleteFlat() {
  const invalidate = useInvalidateProperty();
  return useMutation({
    mutationFn: (id: string) => flatsApi.remove(id),
    onSuccess: invalidate,
  });
}

// --- Staff & service-provider directory (admin) -----------------------------
export function useStaff(kind?: StaffKind) {
  return useQuery({
    queryKey: keys.staff(kind),
    queryFn: () => staffApi.list(kind).then((r) => r.staff),
  });
}

function useInvalidateStaff() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['staff'] });
}

export function useCreateStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: (input: StaffInput) => staffApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<StaffInput> }) =>
      staffApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteStaff() {
  const invalidate = useInvalidateStaff();
  return useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: invalidate,
  });
}

// --- Complaints / helpdesk --------------------------------------------------
export function useComplaints(filters: ComplaintFilters = {}) {
  return useQuery({
    queryKey: keys.complaints(filters),
    queryFn: () => complaintsApi.list(filters).then((r) => r.complaints),
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: keys.complaint(id),
    queryFn: () => complaintsApi.get(id).then((r) => r.complaint),
    enabled: !!id,
  });
}

function useInvalidateComplaints() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: ['complaints'] });
    if (id) qc.invalidateQueries({ queryKey: keys.complaint(id) });
  };
}

export function useCreateComplaint() {
  const invalidate = useInvalidateComplaints();
  return useMutation({
    mutationFn: (input: CreateComplaintInput) => complaintsApi.create(input).then((r) => r.complaint),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateComplaint(id: string) {
  const invalidate = useInvalidateComplaints();
  return useMutation({
    mutationFn: (input: PatchComplaintInput) => complaintsApi.patch(id, input).then((r) => r.complaint),
    onSuccess: () => invalidate(id),
  });
}

export function useAddComment(id: string) {
  const invalidate = useInvalidateComplaints();
  return useMutation({
    mutationFn: (body: string) => complaintsApi.addComment(id, body),
    onSuccess: () => invalidate(id),
  });
}

// --- Maintenance dues -------------------------------------------------------
export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery({
    queryKey: keys.invoices(filters),
    queryFn: () => maintenanceApi.list(filters).then((r) => r.invoices),
  });
}

function useInvalidateInvoices() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['invoices'] });
}

export function useCreateInvoice() {
  const invalidate = useInvalidateInvoices();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => maintenanceApi.create(input),
    onSuccess: invalidate,
  });
}

export function useMarkInvoicePaid() {
  const invalidate = useInvalidateInvoices();
  return useMutation({
    mutationFn: (id: string) => maintenanceApi.markPaid(id),
    onSuccess: invalidate,
  });
}

// --- Polls ------------------------------------------------------------------
export function usePolls() {
  return useQuery({
    queryKey: keys.polls(),
    queryFn: () => pollsApi.list().then((r) => r.polls),
  });
}

export function usePoll(id: string) {
  return useQuery({
    queryKey: keys.poll(id),
    queryFn: () => pollsApi.get(id),
    enabled: !!id,
  });
}

export function usePollResults(id: string) {
  return useQuery({
    queryKey: keys.pollResults(id),
    queryFn: () => pollsApi.results(id),
    enabled: !!id,
  });
}

export function useCreatePoll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePollInput) => pollsApi.create(input).then((r) => r.poll),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.polls() }),
  });
}

export function useVotePoll(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (optionIds: string[]) => pollsApi.vote(id, optionIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.poll(id) });
      qc.invalidateQueries({ queryKey: keys.pollResults(id) });
      qc.invalidateQueries({ queryKey: keys.polls() });
    },
  });
}

export function useClosePoll(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => pollsApi.close(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.poll(id) });
      qc.invalidateQueries({ queryKey: keys.pollResults(id) });
      qc.invalidateQueries({ queryKey: keys.polls() });
    },
  });
}

// --- Amenities & bookings ---------------------------------------------------
export function useAmenities() {
  return useQuery({
    queryKey: keys.amenities(),
    queryFn: () => amenitiesApi.list().then((r) => r.amenities),
  });
}

export function useAmenity(id: string) {
  return useQuery({
    queryKey: keys.amenity(id),
    queryFn: () => amenitiesApi.get(id).then((r) => r.amenity),
    enabled: !!id,
  });
}

export function useAmenityAvailability(id: string, from: string, to: string) {
  return useQuery({
    queryKey: keys.availability(id, from, to),
    queryFn: () => amenitiesApi.availability(id, from, to).then((r) => r.bookings),
    enabled: !!id && !!from && !!to,
  });
}

function useInvalidateAmenities() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['amenities'] });
}

export function useCreateAmenity() {
  const invalidate = useInvalidateAmenities();
  return useMutation({
    mutationFn: (input: AmenityInput) => amenitiesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateAmenity() {
  const invalidate = useInvalidateAmenities();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AmenityInput> }) =>
      amenitiesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useAmenityBookings(id: string) {
  return useQuery({
    queryKey: keys.amenityBookings(id),
    queryFn: () => amenitiesApi.bookings(id).then((r) => r.bookings),
    enabled: !!id,
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: keys.bookings(),
    queryFn: () => bookingsApi.list().then((r) => r.bookings),
  });
}

function useInvalidateBookings() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['bookings'] });
    qc.invalidateQueries({ queryKey: ['availability'] });
  };
}

export function useCreateBooking() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: (input: BookingInput) => bookingsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useCancelBooking() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: invalidate,
  });
}
