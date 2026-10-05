-- Repair Family Access PIN validation and make unlock input normalization explicit.
create or replace function public.change_family_access_pin(new_pin text)
returns void
language plpgsql security definer set search_path=public,extensions
as $$
declare fid uuid; clean_pin text:=btrim(new_pin);
begin
 if clean_pin !~ '^[0-9]{4,6}$' then raise exception 'PIN must be 4 to 6 digits'; end if;
 select fm.family_id into fid from public.family_members fm where fm.user_id=auth.uid() limit 1;
 if fid is null then raise exception 'Parent family membership required'; end if;
 update public.family_access set pin_hash=crypt(clean_pin,gen_salt('bf')),updated_at=now() where family_id=fid;
end $$;

create or replace function public.regenerate_family_access(keep_pin boolean default true, new_pin text default null)
returns text
language plpgsql security definer set search_path=public,extensions
as $$
declare fid uuid; raw_token text; chosen_pin text;
begin
 select fm.family_id into fid from public.family_members fm where fm.user_id=auth.uid() limit 1;
 if fid is null then raise exception 'Parent family membership required'; end if;
 if new_pin is not null and btrim(new_pin) !~ '^[0-9]{4,6}$' then raise exception 'PIN must be 4 to 6 digits'; end if;
 raw_token:=encode(gen_random_bytes(32),'hex');
 chosen_pin:=coalesce(btrim(new_pin),'1234');
 insert into public.family_access(family_id,token_hash,pin_hash,enabled,updated_at)
 values(fid,encode(digest(raw_token,'sha256'),'hex'),crypt(chosen_pin,gen_salt('bf')),true,now())
 on conflict(family_id) do update set token_hash=excluded.token_hash,
   pin_hash=case when keep_pin and new_pin is null then family_access.pin_hash else excluded.pin_hash end,
   enabled=true,updated_at=now();
 return raw_token;
end $$;

create or replace function public.open_family_access(access_token text, access_pin text)
returns jsonb
language plpgsql security definer set search_path=public,extensions
as $$
declare a public.family_access; payload jsonb; clean_token text:=btrim(access_token); clean_pin text:=btrim(access_pin);
begin
 select * into a from public.family_access
 where enabled and token_hash=encode(digest(clean_token,'sha256'),'hex') limit 1;
 if a.family_id is null or a.pin_hash<>crypt(clean_pin,a.pin_hash) then raise exception 'Invalid family link or PIN'; end if;
 select jsonb_build_object(
  'familyId',a.family_id,
  'children',coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'emoji',c.emoji) order by c.created_at),'[]'::jsonb)
 ) into payload from public.children c where c.family_id=a.family_id;
 return payload;
end $$;

revoke all on function public.change_family_access_pin(text) from public;
revoke all on function public.regenerate_family_access(boolean,text) from public;
grant execute on function public.change_family_access_pin(text) to authenticated;
grant execute on function public.regenerate_family_access(boolean,text) to authenticated;
grant execute on function public.open_family_access(text,text) to anon,authenticated;
