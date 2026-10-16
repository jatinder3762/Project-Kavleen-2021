-- Retire the legacy shared family URL + PIN access path.
-- Keep the table for audit/migration compatibility, but invalidate every issued link.
update public.family_access set enabled = false, updated_at = now() where enabled = true;

-- Remove RPC execution for all client roles, including implicit PUBLIC privileges.
revoke all on function public.ensure_family_access() from public, anon, authenticated;
revoke all on function public.regenerate_family_access(boolean,text) from public, anon, authenticated;
revoke all on function public.change_family_access_pin(text) from public, anon, authenticated;
revoke all on function public.set_family_access_enabled(boolean) from public, anon, authenticated;
revoke all on function public.open_family_access(text,text) from public, anon, authenticated;
revoke all on function public.load_child_access(text,text,uuid) from public, anon, authenticated;
revoke all on function public.save_child_completion(text,text,uuid,uuid,timestamptz,date) from public, anon, authenticated;
