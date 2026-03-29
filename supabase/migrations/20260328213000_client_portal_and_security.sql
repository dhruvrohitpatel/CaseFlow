do $$
begin
  if exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    alter type public.app_role add value if not exists 'client';
  end if;
end
$$;

alter table public.profiles
  add column if not exists must_reset_password boolean not null default false;

alter table public.clients
  add column if not exists portal_profile_id uuid references public.profiles (id) on delete set null;

create unique index if not exists clients_portal_profile_id_key
  on public.clients (portal_profile_id)
  where portal_profile_id is not null;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_must_reset_password_idx
  on public.profiles (must_reset_password)
  where must_reset_password = true;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('admin', 'staff'), false);
$$;

create or replace function public.get_client_service_activity()
returns table (
  service_entry_id uuid,
  service_date date,
  service_type_name text,
  staff_member_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    se.id as service_entry_id,
    se.service_date,
    st.name as service_type_name,
    se.staff_member_name
  from public.clients c
  join public.service_entries se on se.client_id = c.id
  join public.service_types st on st.id = se.service_type_id
  where c.portal_profile_id = auth.uid()
  order by se.service_date desc, se.created_at desc;
$$;

grant execute on function public.get_client_service_activity() to authenticated;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.is_admin()
);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "authenticated users can read service types" on public.service_types;
create policy "staff and admins can read service types"
on public.service_types
for select
to authenticated
using (public.is_staff_or_admin());

drop policy if exists "authenticated users can read clients" on public.clients;
create policy "staff admins and linked clients can read clients"
on public.clients
for select
to authenticated
using (
  public.is_staff_or_admin()
  or portal_profile_id = auth.uid()
);

drop policy if exists "authenticated users can create clients" on public.clients;
create policy "staff and admins can create clients"
on public.clients
for insert
to authenticated
with check (public.is_staff_or_admin());

drop policy if exists "authenticated users can update clients" on public.clients;
create policy "staff and admins can update clients"
on public.clients
for update
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "authenticated users can read service entries" on public.service_entries;
create policy "staff and admins can read service entries"
on public.service_entries
for select
to authenticated
using (public.is_staff_or_admin());

drop policy if exists "authenticated users can create own service entries" on public.service_entries;
create policy "staff and admins can create own service entries"
on public.service_entries
for insert
to authenticated
with check (
  public.is_staff_or_admin()
  and auth.uid() = staff_member_profile_id
);

drop policy if exists "authenticated users can read appointments" on public.appointments;
create policy "staff admins and linked clients can read appointments"
on public.appointments
for select
to authenticated
using (
  public.is_staff_or_admin()
  or exists (
    select 1
    from public.clients c
    where c.id = appointments.client_id
      and c.portal_profile_id = auth.uid()
  )
);

drop policy if exists "authenticated users can create appointments" on public.appointments;
create policy "staff and admins can create appointments"
on public.appointments
for insert
to authenticated
with check (public.is_staff_or_admin());

drop policy if exists "authenticated users can update appointments" on public.appointments;
create policy "staff and admins can update appointments"
on public.appointments
for update
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "authenticated users can delete appointments" on public.appointments;
create policy "staff and admins can delete appointments"
on public.appointments
for delete
to authenticated
using (public.is_staff_or_admin());

drop policy if exists "authenticated users can read custom field definitions" on public.custom_field_definitions;
create policy "staff and admins can read custom field definitions"
on public.custom_field_definitions
for select
to authenticated
using (public.is_staff_or_admin());

drop policy if exists "authenticated users can read client custom field values" on public.client_custom_field_values;
create policy "staff and admins can read client custom field values"
on public.client_custom_field_values
for select
to authenticated
using (public.is_staff_or_admin());

drop policy if exists "authenticated users can create client custom field values" on public.client_custom_field_values;
create policy "staff and admins can create client custom field values"
on public.client_custom_field_values
for insert
to authenticated
with check (public.is_staff_or_admin());

drop policy if exists "authenticated users can update client custom field values" on public.client_custom_field_values;
create policy "staff and admins can update client custom field values"
on public.client_custom_field_values
for update
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "authenticated users can delete client custom field values" on public.client_custom_field_values;
create policy "staff and admins can delete client custom field values"
on public.client_custom_field_values
for delete
to authenticated
using (public.is_staff_or_admin());

drop policy if exists "authenticated users can read service entry custom field values" on public.service_entry_custom_field_values;
create policy "staff and admins can read service entry custom field values"
on public.service_entry_custom_field_values
for select
to authenticated
using (public.is_staff_or_admin());

drop policy if exists "authenticated users can create service entry custom field values" on public.service_entry_custom_field_values;
create policy "staff and admins can create service entry custom field values"
on public.service_entry_custom_field_values
for insert
to authenticated
with check (public.is_staff_or_admin());

drop policy if exists "authenticated users can update service entry custom field values" on public.service_entry_custom_field_values;
create policy "staff and admins can update service entry custom field values"
on public.service_entry_custom_field_values
for update
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "authenticated users can delete service entry custom field values" on public.service_entry_custom_field_values;
create policy "staff and admins can delete service entry custom field values"
on public.service_entry_custom_field_values
for delete
to authenticated
using (public.is_staff_or_admin());
