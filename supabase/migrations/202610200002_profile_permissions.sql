-- Restrict direct profile updates to editable business fields, even for owners.
revoke update on public.businesses from authenticated;
grant update(name,industry,description,timezone,retention_days) on public.businesses to authenticated;
-- Validate timezone for direct API clients as well as server actions.
create function private.validate_business_timezone() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Invalid timezone'; end if;
 return new;
end $$;
create trigger business_timezone before insert or update of timezone on public.businesses for each row execute function private.validate_business_timezone();
