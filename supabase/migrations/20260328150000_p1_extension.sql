do $$
begin
  if not exists (select 1 from pg_type where typname = 'client_status') then
    create type public.client_status as enum ('active', 'inactive', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'reminder_status') then
    create type public.reminder_status as enum ('not_needed', 'pending', 'sent');
  end if;

  if not exists (select 1 from pg_type where typname = 'custom_field_entity_type') then
    create type public.custom_field_entity_type as enum ('client', 'service_entry');
  end if;

  if not exists (select 1 from pg_type where typname = 'custom_field_type') then
    create type public.custom_field_type as enum ('text', 'textarea', 'number', 'date', 'select');
  end if;
end
$$;

alter table public.clients
  add column if not exists status public.client_status not null default 'active';

create index if not exists clients_status_idx on public.clients (status);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  scheduled_for timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0 and duration_minutes <= 720),
  location text,
  notes text,
  reminder_status public.reminder_status not null default 'not_needed',
  staff_member_profile_id uuid not null references public.profiles (id),
  staff_member_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  entity_type public.custom_field_entity_type not null,
  field_key text not null,
  label text not null,
  field_type public.custom_field_type not null,
  select_options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (entity_type, field_key)
);

create table if not exists public.client_custom_field_values (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  definition_id uuid not null references public.custom_field_definitions (id) on delete cascade,
  value_text text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (client_id, definition_id)
);

create table if not exists public.service_entry_custom_field_values (
  id uuid primary key default gen_random_uuid(),
  service_entry_id uuid not null references public.service_entries (id) on delete cascade,
  definition_id uuid not null references public.custom_field_definitions (id) on delete cascade,
  value_text text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (service_entry_id, definition_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('create', 'update', 'delete')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists appointments_scheduled_for_idx
  on public.appointments (scheduled_for asc);
create index if not exists appointments_client_id_scheduled_for_idx
  on public.appointments (client_id, scheduled_for asc);
create index if not exists custom_field_definitions_entity_type_sort_order_idx
  on public.custom_field_definitions (entity_type, sort_order asc, created_at asc);
create index if not exists client_custom_field_values_client_id_idx
  on public.client_custom_field_values (client_id);
create index if not exists service_entry_custom_field_values_service_entry_id_idx
  on public.service_entry_custom_field_values (service_entry_id);
create index if not exists audit_logs_entity_type_created_at_idx
  on public.audit_logs (entity_type, created_at desc);
create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row
execute procedure public.set_updated_at();

drop trigger if exists custom_field_definitions_set_updated_at on public.custom_field_definitions;
create trigger custom_field_definitions_set_updated_at
before update on public.custom_field_definitions
for each row
execute procedure public.set_updated_at();

drop trigger if exists client_custom_field_values_set_updated_at on public.client_custom_field_values;
create trigger client_custom_field_values_set_updated_at
before update on public.client_custom_field_values
for each row
execute procedure public.set_updated_at();

drop trigger if exists service_entry_custom_field_values_set_updated_at on public.service_entry_custom_field_values;
create trigger service_entry_custom_field_values_set_updated_at
before update on public.service_entry_custom_field_values
for each row
execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.audit_metadata(table_name text, row_data jsonb)
returns jsonb
language plpgsql
as $$
begin
  case table_name
    when 'clients' then
      return jsonb_build_object(
        'client_id', row_data ->> 'client_id',
        'full_name', row_data ->> 'full_name',
        'status', row_data ->> 'status'
      );
    when 'service_entries' then
      return jsonb_build_object(
        'client_id', row_data ->> 'client_id',
        'service_type_id', row_data ->> 'service_type_id',
        'service_date', row_data ->> 'service_date',
        'staff_member_profile_id', row_data ->> 'staff_member_profile_id'
      );
    when 'appointments' then
      return jsonb_build_object(
        'client_id', row_data ->> 'client_id',
        'scheduled_for', row_data ->> 'scheduled_for',
        'duration_minutes', row_data ->> 'duration_minutes',
        'location', row_data ->> 'location',
        'reminder_status', row_data ->> 'reminder_status',
        'staff_member_profile_id', row_data ->> 'staff_member_profile_id'
      );
    when 'custom_field_definitions' then
      return jsonb_build_object(
        'entity_type', row_data ->> 'entity_type',
        'field_key', row_data ->> 'field_key',
        'label', row_data ->> 'label',
        'field_type', row_data ->> 'field_type',
        'is_required', row_data ->> 'is_required',
        'is_active', row_data ->> 'is_active'
      );
    else
      return row_data - 'notes' - 'value_text' - 'created_at' - 'updated_at';
  end case;
end;
$$;

create or replace function public.insert_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb;
  row_id uuid;
  action_name text;
begin
  if tg_op = 'DELETE' then
    row_data := to_jsonb(old);
    row_id := old.id;
    action_name := 'delete';
  elsif tg_op = 'UPDATE' then
    row_data := to_jsonb(new);
    row_id := new.id;
    action_name := 'update';
  else
    row_data := to_jsonb(new);
    row_id := new.id;
    action_name := 'create';
  end if;

  insert into public.audit_logs (
    actor_profile_id,
    entity_type,
    entity_id,
    action,
    metadata
  )
  values (
    auth.uid(),
    tg_table_name,
    row_id,
    action_name,
    public.audit_metadata(tg_table_name, row_data)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists audit_clients_trigger on public.clients;
create trigger audit_clients_trigger
after insert or update or delete on public.clients
for each row
execute procedure public.insert_audit_log();

drop trigger if exists audit_service_entries_trigger on public.service_entries;
create trigger audit_service_entries_trigger
after insert or update or delete on public.service_entries
for each row
execute procedure public.insert_audit_log();

drop trigger if exists audit_appointments_trigger on public.appointments;
create trigger audit_appointments_trigger
after insert or update or delete on public.appointments
for each row
execute procedure public.insert_audit_log();

drop trigger if exists audit_custom_field_definitions_trigger on public.custom_field_definitions;
create trigger audit_custom_field_definitions_trigger
after insert or update or delete on public.custom_field_definitions
for each row
execute procedure public.insert_audit_log();

alter table public.appointments enable row level security;
alter table public.custom_field_definitions enable row level security;
alter table public.client_custom_field_values enable row level security;
alter table public.service_entry_custom_field_values enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "authenticated users can read appointments" on public.appointments;
create policy "authenticated users can read appointments"
on public.appointments
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create appointments" on public.appointments;
create policy "authenticated users can create appointments"
on public.appointments
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "authenticated users can update appointments" on public.appointments;
create policy "authenticated users can update appointments"
on public.appointments
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "authenticated users can delete appointments" on public.appointments;
create policy "authenticated users can delete appointments"
on public.appointments
for delete
to authenticated
using (auth.uid() is not null);

drop policy if exists "authenticated users can read custom field definitions" on public.custom_field_definitions;
create policy "authenticated users can read custom field definitions"
on public.custom_field_definitions
for select
to authenticated
using (true);

drop policy if exists "admins can create custom field definitions" on public.custom_field_definitions;
create policy "admins can create custom field definitions"
on public.custom_field_definitions
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins can update custom field definitions" on public.custom_field_definitions;
create policy "admins can update custom field definitions"
on public.custom_field_definitions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can delete custom field definitions" on public.custom_field_definitions;
create policy "admins can delete custom field definitions"
on public.custom_field_definitions
for delete
to authenticated
using (public.is_admin());

drop policy if exists "authenticated users can read client custom field values" on public.client_custom_field_values;
create policy "authenticated users can read client custom field values"
on public.client_custom_field_values
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create client custom field values" on public.client_custom_field_values;
create policy "authenticated users can create client custom field values"
on public.client_custom_field_values
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "authenticated users can update client custom field values" on public.client_custom_field_values;
create policy "authenticated users can update client custom field values"
on public.client_custom_field_values
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "authenticated users can delete client custom field values" on public.client_custom_field_values;
create policy "authenticated users can delete client custom field values"
on public.client_custom_field_values
for delete
to authenticated
using (auth.uid() is not null);

drop policy if exists "authenticated users can read service entry custom field values" on public.service_entry_custom_field_values;
create policy "authenticated users can read service entry custom field values"
on public.service_entry_custom_field_values
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create service entry custom field values" on public.service_entry_custom_field_values;
create policy "authenticated users can create service entry custom field values"
on public.service_entry_custom_field_values
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "authenticated users can update service entry custom field values" on public.service_entry_custom_field_values;
create policy "authenticated users can update service entry custom field values"
on public.service_entry_custom_field_values
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "authenticated users can delete service entry custom field values" on public.service_entry_custom_field_values;
create policy "authenticated users can delete service entry custom field values"
on public.service_entry_custom_field_values
for delete
to authenticated
using (auth.uid() is not null);

drop policy if exists "admins can read audit logs" on public.audit_logs;
create policy "admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (public.is_admin());
