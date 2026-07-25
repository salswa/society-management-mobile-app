-- 0006_flat_single_resident.sql — one account per flat
--
-- Enforces that a flat can be linked to at most one resident account. Run once.
-- If this fails with a uniqueness violation, a flat already has 2+ residents —
-- resolve the duplicates first:
--   select flat_id, count(*) from flat_residents group by flat_id having count(*) > 1;

create unique index if not exists flat_residents_flat_unique on flat_residents(flat_id);
