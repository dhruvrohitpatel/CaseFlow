create table if not exists public.access_allowlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role public.app_role not null,
  linked_client_id uuid references public.clients (id) on delete cascade,
  is_active boolean not null default true,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint access_allowlist_email_lowercase check (email = lower(email)),
  constraint access_allowlist_client_link_check check (
    (role = 'client' and linked_client_id is not null)
    or (role in ('admin', 'staff') and linked_client_id is null)
  )
);

create index if not exists access_allowlist_role_idx on public.access_allowlist (role);
create index if not exists access_allowlist_is_active_idx on public.access_allowlist (is_active);
create index if not exists access_allowlist_linked_client_idx on public.access_allowlist (linked_client_id);
create unique index if not exists access_allowlist_unique_linked_client_idx
  on public.access_allowlist (linked_client_id)
  where linked_client_id is not null;

drop trigger if exists access_allowlist_set_updated_at on public.access_allowlist;
create trigger access_allowlist_set_updated_at
before update on public.access_allowlist
for each row
execute function public.set_updated_at();

alter table public.access_allowlist enable row level security;

drop policy if exists "admins can manage access allowlist" on public.access_allowlist;
create policy "admins can manage access allowlist"
on public.access_allowlist
for all
using (public.is_admin())
with check (public.is_admin());

insert into public.access_allowlist (
  email,
  role,
  linked_client_id,
  is_active,
  notes
)
select
  lower(p.email),
  p.role,
  case when p.role = 'client' then c.id else null end,
  true,
  'Backfilled from existing profiles'
from public.profiles p
left join public.clients c on c.portal_profile_id = p.id
where nullif(trim(p.email), '') is not null
on conflict (email) do update
set
  role = excluded.role,
  linked_client_id = excluded.linked_client_id,
  is_active = excluded.is_active,
  notes = excluded.notes,
  updated_at = timezone('utc', now());
