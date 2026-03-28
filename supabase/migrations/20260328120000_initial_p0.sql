create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'staff');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.generate_client_id()
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.client_id_seq');
  return 'CF-' || to_char(timezone('utc', now()), 'YYYY') || '-' || lpad(next_number::text, 4, '0');
end;
$$;

create sequence if not exists public.client_id_seq start with 1 increment by 1;

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null default 'CaseFlow Demo',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'staff',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique default public.generate_client_id(),
  full_name text not null,
  date_of_birth date,
  phone text,
  email text,
  preferred_name text,
  preferred_language text not null default 'English',
  pronouns text,
  housing_status text not null default 'Stable housing',
  referral_source text not null default 'Walk-in',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  service_type_id uuid not null references public.service_types (id),
  service_date date not null default current_date,
  staff_member_profile_id uuid not null references public.profiles (id),
  staff_member_name text not null,
  notes text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists clients_created_at_idx on public.clients (created_at desc);
create index if not exists clients_full_name_lower_idx on public.clients ((lower(full_name)));
create index if not exists service_entries_client_id_date_idx on public.service_entries (client_id, service_date desc, created_at desc);
create index if not exists service_types_sort_order_idx on public.service_types (sort_order asc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

drop trigger if exists organization_settings_set_updated_at on public.organization_settings;
create trigger organization_settings_set_updated_at
before update on public.organization_settings
for each row
execute procedure public.set_updated_at();

drop trigger if exists service_types_set_updated_at on public.service_types;
create trigger service_types_set_updated_at
before update on public.service_types
for each row
execute procedure public.set_updated_at();

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row
execute procedure public.set_updated_at();

drop trigger if exists service_entries_set_updated_at on public.service_entries;
create trigger service_entries_set_updated_at
before update on public.service_entries
for each row
execute procedure public.set_updated_at();

alter table public.organization_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.service_types enable row level security;
alter table public.clients enable row level security;
alter table public.service_entries enable row level security;

drop policy if exists "authenticated users can read organization settings" on public.organization_settings;
create policy "authenticated users can read organization settings"
on public.organization_settings
for select
to authenticated
using (true);

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users can create own profile" on public.profiles;
create policy "users can create own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "authenticated users can read service types" on public.service_types;
create policy "authenticated users can read service types"
on public.service_types
for select
to authenticated
using (true);

drop policy if exists "authenticated users can read clients" on public.clients;
create policy "authenticated users can read clients"
on public.clients
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create clients" on public.clients;
create policy "authenticated users can create clients"
on public.clients
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "authenticated users can update clients" on public.clients;
create policy "authenticated users can update clients"
on public.clients
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "authenticated users can read service entries" on public.service_entries;
create policy "authenticated users can read service entries"
on public.service_entries
for select
to authenticated
using (true);

drop policy if exists "authenticated users can create own service entries" on public.service_entries;
create policy "authenticated users can create own service entries"
on public.service_entries
for insert
to authenticated
with check (auth.uid() = staff_member_profile_id);

insert into public.organization_settings (organization_name)
select 'CaseFlow Demo'
where not exists (select 1 from public.organization_settings);

insert into public.service_types (name, sort_order)
values
  ('Assessment', 1),
  ('Case management', 2),
  ('Resource referral', 3),
  ('Follow-up', 4),
  ('Crisis response', 5),
  ('Shelter check-in', 6)
on conflict (name) do update
set sort_order = excluded.sort_order,
    is_active = true,
    updated_at = timezone('utc', now());
