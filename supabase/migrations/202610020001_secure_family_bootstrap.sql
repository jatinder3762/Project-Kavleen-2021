-- Secure family bootstrap and child photo access.
create or replace function public.create_family_with_owner(family_name text default 'My Family')
returns uuid language plpgsql security definer set search_path=public as $$
declare new_family uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists(select 1 from public.family_members where user_id=auth.uid()) then
    select family_id into new_family from public.family_members where user_id=auth.uid() limit 1;
    return new_family;
  end if;
  insert into public.families(name) values(coalesce(nullif(trim(family_name),''),'My Family')) returning id into new_family;
  insert into public.family_members(family_id,user_id,role) values(new_family,auth.uid(),'parent');
  return new_family;
end $$;
revoke all on function public.create_family_with_owner(text) from public;
grant execute on function public.create_family_with_owner(text) to authenticated;

drop policy if exists "users create families" on public.families;
drop policy if exists "members manage family memberships" on public.family_members;
create policy "members read memberships" on public.family_members for select to authenticated
using (user_id=auth.uid() or public.is_family_member(family_id));

-- Photos use family_id/child_id/... paths.
drop policy if exists "family reads child photos" on storage.objects;
create policy "family reads child photos" on storage.objects for select to authenticated
using (bucket_id='child-photos' and public.is_family_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "family uploads child photos" on storage.objects;
create policy "family uploads child photos" on storage.objects for insert to authenticated
with check (bucket_id='child-photos' and public.is_family_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "family updates child photos" on storage.objects;
create policy "family updates child photos" on storage.objects for update to authenticated
using (bucket_id='child-photos' and public.is_family_member(((storage.foldername(name))[1])::uuid))
with check (bucket_id='child-photos' and public.is_family_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "family deletes child photos" on storage.objects;
create policy "family deletes child photos" on storage.objects for delete to authenticated
using (bucket_id='child-photos' and public.is_family_member(((storage.foldername(name))[1])::uuid));
