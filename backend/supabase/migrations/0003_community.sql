-- 0003_community.sql — complaints/helpdesk + amenities & bookings

-- ---------------------------------------------------------------------------
-- Complaints (helpdesk tickets)
-- ---------------------------------------------------------------------------
do $$ begin
  create type complaint_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type complaint_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

create table if not exists complaints (
  id           uuid primary key default gen_random_uuid(),
  society_id   uuid not null references societies(id) on delete cascade,
  flat_id      uuid references flats(id) on delete set null,
  raised_by    uuid not null references profiles(id) on delete cascade,
  category     text not null default 'general',
  title        text not null,
  description  text,
  priority     complaint_priority not null default 'medium',
  status       complaint_status not null default 'open',
  assigned_to  uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists complaints_society_idx on complaints(society_id);
create index if not exists complaints_raised_by_idx on complaints(raised_by);
create index if not exists complaints_status_idx on complaints(status);

create table if not exists complaint_comments (
  id            uuid primary key default gen_random_uuid(),
  complaint_id  uuid not null references complaints(id) on delete cascade,
  author_id     uuid not null references profiles(id) on delete cascade,
  body          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists complaint_comments_complaint_idx on complaint_comments(complaint_id);

-- ---------------------------------------------------------------------------
-- Amenities + bookings
-- ---------------------------------------------------------------------------
do $$ begin
  create type booking_status as enum ('booked', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists amenities (
  id            uuid primary key default gen_random_uuid(),
  society_id    uuid not null references societies(id) on delete cascade,
  name          text not null,
  description   text,
  capacity      int not null default 1,
  open_time     time not null default '06:00',
  close_time    time not null default '22:00',
  slot_minutes  int not null default 60,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists amenities_society_idx on amenities(society_id);

create table if not exists amenity_bookings (
  id          uuid primary key default gen_random_uuid(),
  amenity_id  uuid not null references amenities(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  flat_id     uuid references flats(id) on delete set null,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  status      booking_status not null default 'booked',
  created_at  timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists amenity_bookings_amenity_idx on amenity_bookings(amenity_id);
create index if not exists amenity_bookings_profile_idx on amenity_bookings(profile_id);
create index if not exists amenity_bookings_window_idx on amenity_bookings(amenity_id, start_time, end_time);

-- RLS: deny-by-default (see 0001 for rationale).
alter table complaints         enable row level security;
alter table complaint_comments enable row level security;
alter table amenities          enable row level security;
alter table amenity_bookings   enable row level security;
