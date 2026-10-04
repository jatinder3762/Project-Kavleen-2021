-- Secure family access for child devices.
-- Parent credentials are never shared. Public access uses a high-entropy token + PIN verified by SECURITY DEFINER RPCs.
create extension if not exists pgcrypto;

create table if not exists public.family_access (
  family_id uuid primary key references public.families(id) on delete cascade,
  token_hash text not null unique,
  pin_hash text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_access enable row level security;
revoke all on public.family_access from anon, authenticated;

create or replace function public.ensure_family_access()
returns text
language plpgsql security definer set search_path=public,extensions
as $$
declare fid uuid; raw_token text;
begin
 select fm.family_id into fid from public.family_members fm where fm.user_id=auth.uid() limit 1;
 if fid is null then raise exception 'Parent family membership required'; end if;
 select encode(gen_random_bytes(32),'hex') into raw_token;
 insert into public.family_access(family_id,token_hash,pin_hash)
 values(fid,encode(digest(raw_token,'sha256'),'hex'),crypt('1234',gen_salt('bf')))
 on conflict(family_id) do nothing;
 if not found then return null; end if;
 return raw_token;
end $$;

create or replace function public.regenerate_family_access(keep_pin boolean default true, new_pin text default null)
returns text
language plpgsql security definer set search_path=public,extensions
as $$
declare fid uuid; raw_token text; chosen_pin text;
begin
 select fm.family_id into fid from public.family_members fm where fm.user_id=auth.uid() limit 1;
 if fid is null then raise exception 'Parent family membership required'; end if;
 if new_pin is not null and new_pin !~ '^\\d{4,6}$' then raise exception 'PIN must be 4 to 6 digits'; end if;
 raw_token:=encode(gen_random_bytes(32),'hex');
 chosen_pin:=coalesce(new_pin,'1234');
 insert into public.family_access(family_id,token_hash,pin_hash,enabled,updated_at)
 values(fid,encode(digest(raw_token,'sha256'),'hex'),crypt(chosen_pin,gen_salt('bf')),true,now())
 on conflict(family_id) do update set token_hash=excluded.token_hash,
   pin_hash=case when keep_pin and new_pin is null then family_access.pin_hash else excluded.pin_hash end,
   enabled=true,updated_at=now();
 return raw_token;
end $$;

create or replace function public.change_family_access_pin(new_pin text)
returns void
language plpgsql security definer set search_path=public,extensions
as $$
declare fid uuid;
begin
 if new_pin !~ '^\\d{4,6}$' then raise exception 'PIN must be 4 to 6 digits'; end if;
 select fm.family_id into fid from public.family_members fm where fm.user_id=auth.uid() limit 1;
 if fid is null then raise exception 'Parent family membership required'; end if;
 update public.family_access set pin_hash=crypt(new_pin,gen_salt('bf')),updated_at=now() where family_id=fid;
end $$;

create or replace function public.set_family_access_enabled(is_enabled boolean)
returns void
language plpgsql security definer set search_path=public
as $$
declare fid uuid;
begin
 select fm.family_id into fid from public.family_members fm where fm.user_id=auth.uid() limit 1;
 if fid is null then raise exception 'Parent family membership required'; end if;
 update public.family_access set enabled=is_enabled,updated_at=now() where family_id=fid;
end $$;

create or replace function public.open_family_access(access_token text, access_pin text)
returns jsonb
language plpgsql security definer set search_path=public,extensions
as $$
declare a public.family_access; payload jsonb;
begin
 select * into a from public.family_access
 where enabled and token_hash=encode(digest(access_token,'sha256'),'hex') limit 1;
 if a.family_id is null or a.pin_hash<>crypt(access_pin,a.pin_hash) then
   raise exception 'Invalid family link or PIN';
 end if;
 select jsonb_build_object(
  'familyId',a.family_id,
  'children',coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'emoji',c.emoji) order by c.created_at),'[]'::jsonb)
 ) into payload from public.children c where c.family_id=a.family_id;
 return payload;
end $$;

create or replace function public.load_child_access(access_token text, access_pin text, requested_child uuid)
returns jsonb
language plpgsql security definer set search_path=public,extensions
as $$
declare a public.family_access; result jsonb;
begin
 select * into a from public.family_access where enabled and token_hash=encode(digest(access_token,'sha256'),'hex') limit 1;
 if a.family_id is null or a.pin_hash<>crypt(access_pin,a.pin_hash) then raise exception 'Invalid family link or PIN'; end if;
 if not exists(select 1 from public.children where id=requested_child and family_id=a.family_id) then raise exception 'Child not in family'; end if;
 select jsonb_build_object(
  'child',jsonb_build_object('id',c.id,'name',c.name,'emoji',c.emoji),
  'sections',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'label',s.label,'icon',s.icon,'order',s.sort_order) order by s.sort_order),'[]'::jsonb) from public.routine_sections s where s.child_id=c.id and s.enabled),
  'activities',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'label',r.label,'emoji',r.emoji,'sectionId',r.section_id,'type',r.activity_type,'order',r.sort_order,'durationMinutes',r.duration_minutes,'dailyLimitMinutes',r.daily_limit_minutes,'scheduleTime',r.schedule_time,'days',r.days,'triggerAfterId',r.trigger_after_id,'reminderMinutes',r.reminder_minutes,'enabled',r.enabled) order by r.sort_order),'[]'::jsonb) from public.routine_activities r where r.child_id=c.id and r.enabled)
 ) into result from public.children c where c.id=requested_child;
 return result;
end $$;

create or replace function public.save_child_completion(access_token text, access_pin text, requested_child uuid, requested_activity uuid, completed_at timestamptz default now(), activity_date date default current_date)
returns void
language plpgsql security definer set search_path=public,extensions
as $$
declare a public.family_access;
begin
 select * into a from public.family_access where enabled and token_hash=encode(digest(access_token,'sha256'),'hex') limit 1;
 if a.family_id is null or a.pin_hash<>crypt(access_pin,a.pin_hash) then raise exception 'Invalid family link or PIN'; end if;
 if not exists(select 1 from public.children where id=requested_child and family_id=a.family_id) then raise exception 'Child not in family'; end if;
 if not exists(select 1 from public.routine_activities where id=requested_activity and child_id=requested_child) then raise exception 'Activity not available'; end if;
 insert into public.activity_events(child_id,activity_id,event_type,occurred_at,metadata)
 values(requested_child,requested_activity,'completed',completed_at,jsonb_build_object('activity_date',activity_date,'source','family_access'));
end $$;

grant execute on function public.ensure_family_access() to authenticated;
grant execute on function public.regenerate_family_access(boolean,text) to authenticated;
grant execute on function public.change_family_access_pin(text) to authenticated;
grant execute on function public.set_family_access_enabled(boolean) to authenticated;
grant execute on function public.open_family_access(text,text) to anon,authenticated;
grant execute on function public.load_child_access(text,text,uuid) to anon,authenticated;
grant execute on function public.save_child_completion(text,text,uuid,uuid,timestamptz,date) to anon,authenticated;
