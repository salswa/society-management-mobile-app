/** Types mirroring the Portl backend response shapes (slice subset). */

export type Role = 'resident' | 'guard' | 'admin';
export type UserStatus = 'pending' | 'active' | 'disabled';
export type UserType = 'resident' | 'non_resident';

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
  user_type: UserType;
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

/** A tower as returned by GET /towers. */
export type Tower = {
  id: string;
  society_id: string;
  name: string;
  created_at: string;
};

/** A flat as returned by GET /flats (admin flat picker). */
export type Flat = {
  id: string;
  number: string;
  floor: number | null;
  tower_id: string;
  tower?: { name: string } | null;
  /** 0 or 1 entry (one account per flat). Present on GET /flats. */
  flat_residents?: Array<{ profile: { id: string; name: string } | null }>;
};

/** A society member as returned by the admin GET /residents. */
export type Member = Profile & {
  flat_residents: Array<{ flat: FlatRef | null }>;
};

export type StaffKind = 'staff' | 'service_provider';

/** An entry in the staff / service-provider directory (GET /staff). */
export type StaffMember = {
  id: string;
  society_id: string;
  name: string;
  kind: StaffKind;
  category: string;
  phone: string | null;
  company: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
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

export type InvoiceStatus = 'pending' | 'paid';

/** A maintenance-dues invoice (GET /maintenance). */
export type MaintenanceInvoice = {
  id: string;
  society_id: string;
  flat_id: string;
  period: string; // YYYY-MM
  amount: number | string; // Postgres numeric may arrive as a string
  due_date: string | null;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
  flat?: FlatRef | null;
};

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ComplaintPriority = 'low' | 'medium' | 'high';

export type ComplaintComment = {
  id: string;
  body: string;
  created_at: string;
  author?: { id: string; name: string } | null;
};

export type Complaint = {
  id: string;
  society_id: string;
  flat_id: string | null;
  raised_by: string;
  category: string;
  title: string;
  description: string | null;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_to: string | null;
  created_at: string;
  raised_by_profile?: { id: string; name: string } | null;
  assignee?: { id: string; name: string } | null;
  comments?: ComplaintComment[];
};

export type Amenity = {
  id: string;
  society_id: string;
  name: string;
  description: string | null;
  capacity: number;
  open_time: string; // HH:MM[:SS]
  close_time: string;
  slot_minutes: number;
  is_active: boolean;
  created_at: string;
};

export type BookingStatus = 'booked' | 'cancelled';

export type AmenityBooking = {
  id: string;
  amenity_id: string;
  profile_id: string;
  flat_id: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
  amenity?: { id: string; name: string } | null;
};

/** Slim booking rows from GET /amenities/:id/availability. */
export type AvailabilityBooking = {
  id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
};

/** Booking with booker + flat, from the admin GET /amenities/:id/bookings. */
export type AmenityBookingAdmin = {
  id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  profile?: { id: string; name: string } | null;
  flat?: FlatRef | null;
};

export type PollStatus = 'open' | 'closed';
export type PollOption = { id: string; text: string; position: number };

export type Poll = {
  id: string;
  society_id: string;
  question: string;
  description: string | null;
  is_multi: boolean;
  status: PollStatus;
  closes_at: string | null;
  created_by: string | null;
  created_at: string;
  options?: PollOption[];
};

export type PollResults = {
  poll: { id: string; question: string; status: PollStatus };
  options: Array<{ id: string; text: string; votes: number }>;
  total: number;
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
