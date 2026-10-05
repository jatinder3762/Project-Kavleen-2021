-- Secure child removal: only an authenticated member of the child's family may remove it.
-- SECURITY DEFINER bypasses fragile client DELETE RLS while retaining an explicit family ownership check.
create or replace function public.remove_family_child(requested_child uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  child_family uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select c.family_id into child_family
  from public.children c
  where c.id=requested_child;

  if child_family is null then
    return;
  end if;

  if not exists (
    select 1 from public.family_members fm
    where fm.family_id=child_family
      and fm.user_id=auth.uid()
  ) then
    raise exception 'Child does not belong to this family';
  end if;

  delete from public.children where id=requested_child;

  if found then return; end if;
  raise exception 'Child could not be removed';
end
$$;

revoke all on function public.remove_family_child(uuid) from public;
grant execute on function public.remove_family_child(uuid) to authenticated;
