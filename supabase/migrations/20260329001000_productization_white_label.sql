alter table public.organization_settings
  add column if not exists product_subtitle text not null default 'Case management and client portals, branded for your organization.',
  add column if not exists public_welcome_text text not null default 'Support staff, clients, and administrators from one calm portal that feels like your own organization.',
  add column if not exists login_welcome_text text not null default 'Use your approved organization account to access your CaseFlow workspace.',
  add column if not exists support_email text,
  add column if not exists support_phone text,
  add column if not exists support_cta_text text not null default 'Contact support',
  add column if not exists primary_color text not null default '#1c1917',
  add column if not exists accent_color text not null default '#e7e5e4',
  add column if not exists surface_tint text not null default '#f5f5f4',
  add column if not exists logo_url text,
  add column if not exists favicon_url text,
  add column if not exists dashboard_headline text,
  add column if not exists approved_domain_guidance text not null default 'Access is managed through approved emails and invite-only client portals.',
  add column if not exists setup_progress jsonb not null default jsonb_build_object(
    'branding', false,
    'details', false,
    'access', false,
    'imports', false,
    'launch', false
  ),
  add column if not exists setup_completed_at timestamptz;

update public.organization_settings
set
  product_subtitle = coalesce(nullif(trim(product_subtitle), ''), 'Case management and client portals, branded for your organization.'),
  public_welcome_text = coalesce(nullif(trim(public_welcome_text), ''), 'Support staff, clients, and administrators from one calm portal that feels like your own organization.'),
  login_welcome_text = coalesce(nullif(trim(login_welcome_text), ''), 'Use your approved organization account to access your CaseFlow workspace.'),
  support_cta_text = coalesce(nullif(trim(support_cta_text), ''), 'Contact support'),
  primary_color = coalesce(nullif(trim(primary_color), ''), '#1c1917'),
  accent_color = coalesce(nullif(trim(accent_color), ''), '#e7e5e4'),
  surface_tint = coalesce(nullif(trim(surface_tint), ''), '#f5f5f4'),
  approved_domain_guidance = coalesce(nullif(trim(approved_domain_guidance), ''), 'Access is managed through approved emails and invite-only client portals.'),
  setup_progress = coalesce(
    setup_progress,
    jsonb_build_object(
      'branding', false,
      'details', false,
      'access', false,
      'imports', false,
      'launch', false
    )
  );

drop policy if exists "admins can update organization settings" on public.organization_settings;
create policy "admins can update organization settings"
on public.organization_settings
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can insert organization settings" on public.organization_settings;
create policy "admins can insert organization settings"
on public.organization_settings
for insert
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('branding-assets', 'branding-assets', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "public can read branding assets" on storage.objects;
create policy "public can read branding assets"
on storage.objects
for select
using (bucket_id = 'branding-assets');

drop policy if exists "admins can manage branding assets" on storage.objects;
create policy "admins can manage branding assets"
on storage.objects
for all
to authenticated
using (bucket_id = 'branding-assets' and public.is_admin())
with check (bucket_id = 'branding-assets' and public.is_admin());

insert into public.organization_settings (
  organization_name,
  product_subtitle,
  public_welcome_text,
  login_welcome_text,
  support_cta_text,
  primary_color,
  accent_color,
  surface_tint,
  approved_domain_guidance,
  setup_progress
)
select
  'CaseFlow Demo',
  'Case management and client portals, branded for your organization.',
  'Support staff, clients, and administrators from one calm portal that feels like your own organization.',
  'Use your approved organization account to access your CaseFlow workspace.',
  'Contact support',
  '#1c1917',
  '#e7e5e4',
  '#f5f5f4',
  'Access is managed through approved emails and invite-only client portals.',
  jsonb_build_object(
    'branding', false,
    'details', false,
    'access', false,
    'imports', false,
    'launch', false
  )
where not exists (select 1 from public.organization_settings);
