-- 0002_visitors.sql — visitor requests, approvals, entry/exit logs

do $$ begin
  create type visitor_type as enum ('guest', 'delivery', 'cab', 'service');
exception when duplicate_object then null; end $$;

-- Status machine:
--   pending -> approved | rejected | expired
--   approved (or pre-approved) -> checked_in -> checked_out
do $$ begin
  create type visitor_status as enum (
    'pending', 'approved', 'rejected', 'expired', 'checked_in', 'checked_out'
  );
exception when duplicate_object then null; end $$;

create table if not exists visitors (
  id              uuid primary key default gen_random_uuid(),
  society_id      uuid not null references societies(id) on delete cascade,
  flat_id         uuid not null references flats(id) on delete cascade,
  name            text not null,
  phone           text,
  type            visitor_type not null default 'guest',
  purpose         text,
  vehicle_no      text,
  photo_url       text,
  code            text,                        -- pre-approval pass code
  is_pre_approved boolean not null default false,
  status          visitor_status not null default 'pending',
  created_by      uuid references profiles(id) on delete set null,  -- guard or resident
  approved_by     uuid references profiles(id) on delete set null,  -- resident/admin who decided
  expected_at     timestamptz,                 -- for pre-approved guests
  entry_at        timestamptz,
  exit_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists visitors_society_idx on visitors(society_id);
create index if not exists visitors_flat_idx on visitors(flat_id);
create index if not exists visitors_status_idx on visitors(status);
create index if not exists visitors_created_at_idx on visitors(created_at desc);
create index if not exists visitors_code_idx on visitors(code);

-- RLS: deny-by-default (see 0001 for rationale).
alter table visitors enable row level security;
