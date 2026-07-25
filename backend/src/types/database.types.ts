/**
 * Hand-authored Supabase schema types (fallback).
 *
 * For a live project you can regenerate the accurate version with:
 *   npm run gen:types
 * (requires the Supabase CLI and SUPABASE_PROJECT_ID). This file mirrors the
 * SQL under supabase/migrations and is safe to use until then.
 */

export type UserRole = 'resident' | 'guard' | 'admin';
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
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ComplaintPriority = 'low' | 'medium' | 'high';
export type BookingStatus = 'booked' | 'cancelled';
export type PollStatus = 'open' | 'closed';
export type DirectoryKind = 'staff' | 'service_provider';
export type InvoiceStatus = 'pending' | 'paid';

export type Society = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export type Tower = {
  id: string;
  society_id: string;
  name: string;
  created_at: string;
}

export type Flat = {
  id: string;
  society_id: string;
  tower_id: string;
  number: string;
  floor: number | null;
  created_at: string;
}

export type Profile = {
  id: string;
  society_id: string | null;
  email: string;
  phone: string | null;
  name: string;
  role: UserRole;
  user_type: UserType;
  status: UserStatus;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
}

export type FlatResident = {
  flat_id: string;
  profile_id: string;
  is_owner: boolean;
  is_primary: boolean;
  created_at: string;
}

export type Visitor = {
  id: string;
  society_id: string;
  flat_id: string;
  name: string;
  phone: string | null;
  type: VisitorType;
  purpose: string | null;
  vehicle_no: string | null;
  photo_url: string | null;
  code: string | null;
  is_pre_approved: boolean;
  status: VisitorStatus;
  created_by: string | null;
  approved_by: string | null;
  expected_at: string | null;
  entry_at: string | null;
  exit_at: string | null;
  created_at: string;
  updated_at: string;
}

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
  updated_at: string;
}

export type ComplaintComment = {
  id: string;
  complaint_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export type Amenity = {
  id: string;
  society_id: string;
  name: string;
  description: string | null;
  capacity: number;
  open_time: string;
  close_time: string;
  slot_minutes: number;
  is_active: boolean;
  created_at: string;
}

export type AmenityBooking = {
  id: string;
  amenity_id: string;
  profile_id: string;
  flat_id: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
}

export type Notice = {
  id: string;
  society_id: string;
  title: string;
  body: string;
  category: string;
  posted_by: string | null;
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
}

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
}

export type PollOption = {
  id: string;
  poll_id: string;
  text: string;
  position: number;
}

export type PollVote = {
  id: string;
  poll_id: string;
  option_id: string;
  profile_id: string;
  created_at: string;
}

export type StaffDirectory = {
  id: string;
  society_id: string;
  name: string;
  kind: DirectoryKind;
  category: string;
  phone: string | null;
  company: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export type MaintenanceInvoice = {
  id: string;
  society_id: string;
  flat_id: string;
  period: string;
  amount: number;
  due_date: string | null;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
}

/** Generic table shape helper: Insert makes generated/defaulted columns optional. */
type TableShape<Row, Optional extends keyof Row> = {
  Row: Row;
  Insert: Omit<Row, Optional> & Partial<Pick<Row, Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      societies: TableShape<Society, 'id' | 'created_at' | 'address'>;
      towers: TableShape<Tower, 'id' | 'created_at'>;
      flats: TableShape<Flat, 'id' | 'created_at' | 'floor'>;
      profiles: TableShape<Profile, 'society_id' | 'phone' | 'user_type' | 'status' | 'expo_push_token' | 'created_at' | 'updated_at'>;
      flat_residents: TableShape<FlatResident, 'is_owner' | 'is_primary' | 'created_at'>;
      visitors: TableShape<
        Visitor,
        | 'id'
        | 'phone'
        | 'type'
        | 'purpose'
        | 'vehicle_no'
        | 'photo_url'
        | 'code'
        | 'is_pre_approved'
        | 'status'
        | 'created_by'
        | 'approved_by'
        | 'expected_at'
        | 'entry_at'
        | 'exit_at'
        | 'created_at'
        | 'updated_at'
      >;
      complaints: TableShape<
        Complaint,
        | 'id'
        | 'flat_id'
        | 'category'
        | 'description'
        | 'priority'
        | 'status'
        | 'assigned_to'
        | 'created_at'
        | 'updated_at'
      >;
      complaint_comments: TableShape<ComplaintComment, 'id' | 'created_at'>;
      amenities: TableShape<
        Amenity,
        | 'id'
        | 'description'
        | 'capacity'
        | 'open_time'
        | 'close_time'
        | 'slot_minutes'
        | 'is_active'
        | 'created_at'
      >;
      amenity_bookings: TableShape<AmenityBooking, 'id' | 'flat_id' | 'status' | 'created_at'>;
      notices: TableShape<
        Notice,
        'id' | 'category' | 'posted_by' | 'is_pinned' | 'published_at' | 'expires_at'
      >;
      polls: TableShape<
        Poll,
        'id' | 'description' | 'is_multi' | 'status' | 'closes_at' | 'created_by' | 'created_at'
      >;
      poll_options: TableShape<PollOption, 'id' | 'position'>;
      poll_votes: TableShape<PollVote, 'id' | 'created_at'>;
      staff_directory: TableShape<
        StaffDirectory,
        'id' | 'kind' | 'category' | 'phone' | 'company' | 'photo_url' | 'is_active' | 'created_at'
      >;
      maintenance_invoices: TableShape<
        MaintenanceInvoice,
        'id' | 'due_date' | 'status' | 'paid_at' | 'created_at'
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      visitor_type: VisitorType;
      visitor_status: VisitorStatus;
      complaint_status: ComplaintStatus;
      complaint_priority: ComplaintPriority;
      booking_status: BookingStatus;
      poll_status: PollStatus;
      directory_kind: DirectoryKind;
      invoice_status: InvoiceStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
