create table if not exists public.intake_capture_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  source_filename text not null,
  source_image_path text not null,
  status text not null default 'uploaded',
  provider text,
  model text,
  core_fields_json jsonb not null default '{}'::jsonb,
  custom_fields_json jsonb not null default '[]'::jsonb,
  warnings_json jsonb not null default '[]'::jsonb,
  confidence_json jsonb not null default '{}'::jsonb,
  raw_model_output_json jsonb not null default '{}'::jsonb,
  created_client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists intake_capture_sessions_created_by_idx
  on public.intake_capture_sessions (created_by, created_at desc);

create index if not exists intake_capture_sessions_status_idx
  on public.intake_capture_sessions (status, created_at desc);

drop trigger if exists intake_capture_sessions_set_updated_at on public.intake_capture_sessions;
create trigger intake_capture_sessions_set_updated_at
before update on public.intake_capture_sessions
for each row
execute function public.set_updated_at();

alter table public.intake_capture_sessions enable row level security;

drop policy if exists "staff and admins manage intake capture sessions" on public.intake_capture_sessions;
create policy "staff and admins manage intake capture sessions"
on public.intake_capture_sessions
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

insert into storage.buckets (id, name, public)
values ('intake-source-images', 'intake-source-images', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "staff and admins can read intake source images" on storage.objects;
create policy "staff and admins can read intake source images"
on storage.objects
for select
to authenticated
using (bucket_id = 'intake-source-images' and public.is_staff_or_admin());

drop policy if exists "staff and admins can manage intake source images" on storage.objects;
create policy "staff and admins can manage intake source images"
on storage.objects
for all
to authenticated
using (bucket_id = 'intake-source-images' and public.is_staff_or_admin())
with check (bucket_id = 'intake-source-images' and public.is_staff_or_admin());
