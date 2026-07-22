-- 0004_engagement.sql — notices, polls, staff directory, maintenance dues

-- ---------------------------------------------------------------------------
-- Notice board
-- ---------------------------------------------------------------------------
create table if not exists notices (
  id            uuid primary key default gen_random_uuid(),
  society_id    uuid not null references societies(id) on delete cascade,
  title         text not null,
  body          text not null,
  category      text not null default 'general',
  posted_by     uuid references profiles(id) on delete set null,
  is_pinned     boolean not null default false,
  published_at  timestamptz not null default now(),
  expires_at    timestamptz
);
create index if not exists notices_society_idx on notices(society_id);
create index if not exists notices_published_idx on notices(published_at desc);

-- ---------------------------------------------------------------------------
-- Polls
-- ---------------------------------------------------------------------------
do $$ begin
  create type poll_status as enum ('open', 'closed');
exception when duplicate_object then null; end $$;

create table if not exists polls (
  id           uuid primary key default gen_random_uuid(),
  society_id   uuid not null references societies(id) on delete cascade,
  question     text not null,
  description  text,
  is_multi     boolean not null default false,
  status       poll_status not null default 'open',
  closes_at    timestamptz,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists polls_society_idx on polls(society_id);

create table if not exists poll_options (
  id        uuid primary key default gen_random_uuid(),
  poll_id   uuid not null references polls(id) on delete cascade,
  text      text not null,
  position  int not null default 0
);
create index if not exists poll_options_poll_idx on poll_options(poll_id);

create table if not exists poll_votes (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid not null references polls(id) on delete cascade,
  option_id   uuid not null references poll_options(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- one vote per (poll, option, voter); single-choice enforced in app layer
  unique (poll_id, option_id, profile_id)
);
create index if not exists poll_votes_poll_idx on poll_votes(poll_id);
create index if not exists poll_votes_profile_idx on poll_votes(profile_id);

-- ---------------------------------------------------------------------------
-- Staff + service-provider directory
-- ---------------------------------------------------------------------------
do $$ begin
  create type directory_kind as enum ('staff', 'service_provider');
exception when duplicate_object then null; end $$;

create table if not exists staff_directory (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references societies(id) on delete cascade,
  name        text not null,
  kind        directory_kind not null default 'staff',
  category    text not null default 'general',   -- e.g. plumber, electrician, security
  phone       text,
  company     text,
  photo_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists staff_directory_society_idx on staff_directory(society_id);

-- ---------------------------------------------------------------------------
-- Maintenance dues (manual mark-paid; no payment gateway)
-- ---------------------------------------------------------------------------
do $$ begin
  create type invoice_status as enum ('pending', 'paid');
exception when duplicate_object then null; end $$;

create table if not exists maintenance_invoices (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references societies(id) on delete cascade,
  flat_id     uuid not null references flats(id) on delete cascade,
  period      text not null,                    -- e.g. '2026-07'
  amount      numeric(12,2) not null,
  due_date    date,
  status      invoice_status not null default 'pending',
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists maintenance_flat_idx on maintenance_invoices(flat_id);
create index if not exists maintenance_society_idx on maintenance_invoices(society_id);

-- RLS: deny-by-default (see 0001 for rationale).
alter table notices              enable row level security;
alter table polls                enable row level security;
alter table poll_options         enable row level security;
alter table poll_votes           enable row level security;
alter table staff_directory      enable row level security;
alter table maintenance_invoices enable row level security;
