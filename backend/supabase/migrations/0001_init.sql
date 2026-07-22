-- 0001_init.sql — core org + identity
-- Portl society management. Requires the pgcrypto extension for gen_random_uuid().

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('resident', 'guard', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('pending', 'active', 'disabled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Societies
-- ---------------------------------------------------------------------------
create table if not exists societies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Towers
-- ---------------------------------------------------------------------------
create table if not exists towers (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references societies(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (society_id, name)
);
create index if not exists towers_society_idx on towers(society_id);

-- ---------------------------------------------------------------------------
-- Flats
-- ---------------------------------------------------------------------------
create table if not exists flats (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references societies(id) on delete cascade,
  tower_id    uuid not null references towers(id) on delete cascade,
  number      text not null,
  floor       int,
  created_at  timestamptz not null default now(),
  unique (tower_id, number)
);
create index if not exists flats_society_idx on flats(society_id);
create index if not exists flats_tower_idx on flats(tower_id);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  society_id       uuid references societies(id) on delete set null,
  email            text not null unique,
  phone            text unique,                   -- nullable for now; used when phone+OTP is added
  name             text not null,
  role             user_role not null default 'resident',
  status           user_status not null default 'pending',
  expo_push_token  text,                          -- reserved for later push phase
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists profiles_society_idx on profiles(society_id);
create index if not exists profiles_role_idx on profiles(role);
create index if not exists profiles_name_idx on profiles(lower(name));
create index if not exists profiles_email_idx on profiles(lower(email));

-- ---------------------------------------------------------------------------
-- Flat <-> Resident membership (many residents per flat)
-- ---------------------------------------------------------------------------
create table if not exists flat_residents (
  flat_id     uuid not null references flats(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  is_owner    boolean not null default false,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  primary key (flat_id, profile_id)
);
create index if not exists flat_residents_profile_idx on flat_residents(profile_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (deny-by-default).
-- All app traffic goes through the Node backend using the SECRET key, which
-- bypasses RLS; authorization is enforced in middleware. We still enable RLS
-- with NO permissive policies so the publishable/anon key gets zero access.
-- ---------------------------------------------------------------------------
alter table societies      enable row level security;
alter table towers         enable row level security;
alter table flats          enable row level security;
alter table profiles       enable row level security;
alter table flat_residents enable row level security;
