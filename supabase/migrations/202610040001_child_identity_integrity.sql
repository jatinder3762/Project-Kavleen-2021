-- Child identity integrity: DOB is used with normalized name to prevent accidental duplicates.
-- Existing child rows may remain null until a parent edits them; the app requires DOB for new/edited profiles.
alter table public.children
  add column if not exists date_of_birth date;

create unique index if not exists children_family_name_dob_unique
  on public.children (family_id, lower(btrim(name)), date_of_birth)
  where date_of_birth is not null;

alter table public.children
  drop constraint if exists children_date_of_birth_not_future;

alter table public.children
  add constraint children_date_of_birth_not_future
  check (date_of_birth is null or date_of_birth <= current_date);
