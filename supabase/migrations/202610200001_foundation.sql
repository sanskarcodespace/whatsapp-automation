create extension if not exists vector with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.super_admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table public.businesses (
 id uuid primary key default gen_random_uuid(), name text not null check(char_length(name) between 2 and 120),
 industry text not null check(industry in ('property','gym','other')), description text not null default '' check(char_length(description)<=2000),
 timezone text not null default 'Asia/Kolkata', retention_days integer not null default 90 check(retention_days between 7 and 3650),
 created_at timestamptz not null default now()
);
create table public.memberships (
 business_id uuid not null references public.businesses(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','admin','agent','viewer')), created_at timestamptz not null default now(),
 primary key(business_id,user_id)
);
create unique index one_owner on public.memberships(business_id) where role='owner';
create index memberships_user on public.memberships(user_id);
create function public.is_super_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.super_admins where user_id=auth.uid());
$$;
create function public.has_role(tenant uuid, roles text[] default array['owner','admin','agent','viewer']) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships where business_id=tenant and user_id=auth.uid() and role=any(roles));
$$;
create function public.create_business(p_name text,p_industry text,p_description text,p_timezone text,p_retention_days integer) returns uuid language plpgsql security definer set search_path='' as $$
declare tenant uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'Invalid timezone'; end if;
 insert into public.businesses(name,industry,description,timezone,retention_days) values(trim(p_name),p_industry,p_description,p_timezone,p_retention_days) returning id into tenant;
 insert into public.memberships(business_id,user_id,role) values(tenant,auth.uid(),'owner');
 insert into public.ai_settings(business_id) values(tenant);
 return tenant;
end $$;
create function public.manage_member(tenant uuid, member_email text, new_role text) returns void language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 -- Serialize membership changes, including concurrent requests.
 perform 1 from public.businesses where id=tenant for update;
 if not public.has_role(tenant,array['owner']) then raise exception 'Owner access required' using errcode='42501'; end if;
 if new_role is not null and new_role not in ('admin','agent','viewer') then raise exception 'Invalid role'; end if;
 select id into target from auth.users where lower(email)=lower(trim(member_email)) and email_confirmed_at is not null;
 if target is null then raise exception 'A verified account is required'; end if;
 if exists(select 1 from public.memberships where business_id=tenant and user_id=target and role='owner') then raise exception 'Owner cannot be modified'; end if;
 if new_role is null then delete from public.memberships where business_id=tenant and user_id=target;
 else insert into public.memberships(business_id,user_id,role) values(tenant,target,new_role) on conflict(business_id,user_id) do update set role=excluded.role; end if;
end $$;
create function public.team_members(tenant uuid) returns table(user_id uuid,email text,role text) language plpgsql stable security definer set search_path='' as $$
begin
 if not public.has_role(tenant,array['owner','admin']) then raise exception 'Manager access required' using errcode='42501'; end if;
 return query select m.user_id,u.email::text,m.role from public.memberships m join auth.users u on u.id=m.user_id where m.business_id=tenant order by m.created_at;
end $$;
create table public.contacts(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,name text not null,phone text,created_at timestamptz not null default now(),unique(business_id,id));
create table public.conversations(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,contact_id uuid,status text not null default 'open' check(status in ('open','handoff','closed')),created_at timestamptz not null default now(),unique(business_id,id),foreign key(business_id,contact_id) references public.contacts(business_id,id));
create table public.messages(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,conversation_id uuid not null,direction text not null check(direction in ('inbound','outbound')),body text not null,created_at timestamptz not null default now(),foreign key(business_id,conversation_id) references public.conversations(business_id,id));
create table public.leads(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,contact_id uuid,name text not null,stage text not null default 'new' check(stage in ('new','qualified','won','lost')),notes text not null default '',created_at timestamptz not null default now(),foreign key(business_id,contact_id) references public.contacts(business_id,id));
create table public.knowledge_documents(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,title text not null,storage_path text,content text,embedding extensions.vector(1536),created_at timestamptz not null default now());
create table public.ai_settings(business_id uuid primary key references public.businesses on delete cascade,enabled boolean not null default false,provider text,model text,instructions text not null default '',created_at timestamptz not null default now());
create table public.style_profiles(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,name text not null,profile jsonb not null default '{}',approved_at timestamptz,created_at timestamptz not null default now());
create table public.chat_imports(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,storage_path text not null,representative text not null,consent_at timestamptz not null,status text not null default 'pending',delete_after timestamptz not null,created_at timestamptz not null default now());
create table public.appointments(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,contact_id uuid,title text not null,starts_at timestamptz not null,ends_at timestamptz not null,created_at timestamptz not null default now(),check(ends_at>starts_at),foreign key(business_id,contact_id) references public.contacts(business_id,id));
-- Only connection metadata belongs in the public schema. Future secrets use a server-side vault.
create table public.whatsapp_accounts(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,phone_number_id text unique,display_phone text,status text not null default 'disconnected',created_at timestamptz not null default now());
create table public.usage_records(id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses on delete cascade,metric text not null,quantity bigint not null check(quantity>=0),created_at timestamptz not null default now());
alter table public.businesses enable row level security;
alter table public.memberships enable row level security;
create policy business_read on public.businesses for select to authenticated using(public.has_role(id) or public.is_super_admin());
create policy business_update on public.businesses for update to authenticated using(public.has_role(id,array['owner','admin'])) with check(public.has_role(id,array['owner','admin']));
create policy membership_read on public.memberships for select to authenticated using(public.has_role(business_id));
grant select,update on public.businesses to authenticated;
grant select on public.memberships to authenticated;
do $$
declare t text;
begin
 foreach t in array array['contacts','conversations','messages','leads','knowledge_documents','ai_settings','style_profiles','chat_imports','appointments','whatsapp_accounts','usage_records'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy tenant_read on public.%I for select to authenticated using(public.has_role(business_id))',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create index on public.%I(business_id)',t);
 -- Phase 1 operational data is read-only; future phases explicitly grant writes.
 end loop;
end $$;
revoke all on all functions in schema public from public,anon,authenticated;
grant execute on function public.is_super_admin(),public.has_role(uuid,text[]),public.create_business(text,text,text,text,integer),public.manage_member(uuid,text,text),public.team_members(uuid) to authenticated;
grant all on all tables in schema public to service_role;
insert into storage.buckets(id,name,public) values('business-files','business-files',false);
-- Uploads are deferred. Existing private files may only be read by members of their UUID folder.
create policy tenant_file_read on storage.objects for select to authenticated using(bucket_id='business-files' and exists(select 1 from public.memberships m where m.user_id=auth.uid() and m.business_id::text=(storage.foldername(name))[1]));
