-- 0007_user_type.sql — resident vs non-resident applicant type
--
-- Captured at registration and shown to the admin at approval. Independent of
-- `role` (a non-resident is later approved as guard or admin). Run once.

do $$ begin
  create type user_type as enum ('resident', 'non_resident');
exception when duplicate_object then null; end $$;

alter table profiles add column if not exists user_type user_type not null default 'resident';

-- Backfill existing accounts: guards are non-residents.
update profiles set user_type = 'non_resident' where role = 'guard';
