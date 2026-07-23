/** Types mirroring the Portl backend response shapes (slice subset). */

export type Role = 'resident' | 'guard' | 'admin';
export type UserStatus = 'pending' | 'active' | 'disabled';

export type VisitorType = 'guest' | 'delivery' | 'cab' | 'service';
export type VisitorStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'checked_in'
  | 'checked_out';

export type Profile = {
  id: string;
  society_id: string | null;
  email: string;
  phone: string | null;
  name: string;
  role: Role;
  status: UserStatus;
  created_at: string;
};

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

export type FlatRef = {
  id: string;
  number: string;
  tower?: { name: string } | null;
};

export type Visitor = {
  id: string;
  society_id: string;
  flat_id: string;
  name: string;
  phone: string | null;
  type: VisitorType;
  purpose: string | null;
  vehicle_no: string | null;
  code: string | null;
  is_pre_approved: boolean;
  status: VisitorStatus;
  expected_at: string | null;
  entry_at: string | null;
  exit_at: string | null;
  created_at: string;
  flat?: FlatRef | null;
  created_by_profile?: { name: string; role: Role } | null;
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  category: string;
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
  posted_by_profile?: { id: string; name: string } | null;
};

/** Guard resident-search result. */
export type ResidentSearchResult = {
  residents: Array<{
    id: string;
    name: string;
    phone: string | null;
    flat_residents: Array<{ flat: FlatRef | null }>;
  }>;
  flats: Array<
    FlatRef & {
      residents: Array<{ profile: { id: string; name: string; phone: string | null } | null }>;
    }
  >;
};
