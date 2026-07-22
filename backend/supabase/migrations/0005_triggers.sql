-- 0005_triggers.sql — updated_at auto-touch

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger trg_profiles_updated
    before update on profiles
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_visitors_updated
    before update on visitors
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger trg_complaints_updated
    before update on complaints
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
