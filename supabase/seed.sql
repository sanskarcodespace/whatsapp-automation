-- LOCAL DEVELOPMENT ONLY. Never apply these known credentials to hosted environments.
do $$
declare account record;
begin
 for account in select * from (values
 ('00000000-0000-4000-8000-000000000001'::uuid,'broker@example.test'),
 ('00000000-0000-4000-8000-000000000002'::uuid,'gym@example.test'),
 ('00000000-0000-4000-8000-000000000003'::uuid,'admin@example.test'),
 ('00000000-0000-4000-8000-000000000004'::uuid,'viewer@example.test')) as a(id,email)
 loop
 insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
 values('00000000-0000-0000-0000-000000000000',account.id,'authenticated','authenticated',account.email,extensions.crypt('LocalDemo!2026',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
 insert into auth.identities(id,user_id,provider_id,identity_data,provider,created_at,updated_at) values(gen_random_uuid(),account.id,account.id::text,jsonb_build_object('sub',account.id,'email',account.email),'email',now(),now());
 end loop;
end $$;
insert into private.super_admins values('00000000-0000-4000-8000-000000000003');
insert into public.businesses(id,name,industry,description) values
 ('10000000-0000-4000-8000-000000000001','Skyline Properties','property','Independent property advisory in Pune.'),
 ('10000000-0000-4000-8000-000000000002','Momentum Fitness','gym','Strength training and personal coaching.');
insert into public.memberships(business_id,user_id,role) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','owner'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002','owner'),
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000004','viewer');
insert into public.leads(business_id,name,stage,notes) values
 ('10000000-0000-4000-8000-000000000001','Sample home buyer','qualified','Looking for a two-bedroom apartment.'),
 ('10000000-0000-4000-8000-000000000001','Sample investor','new','Interested in commercial property.'),
 ('10000000-0000-4000-8000-000000000002','Sample fitness member','new','Requested a trial training session.');
insert into public.ai_settings(business_id) select id from public.businesses;
insert into public.whatsapp_accounts(business_id) select id from public.businesses;
insert into public.usage_records(business_id,metric,quantity) select id,'messages',0 from public.businesses;
