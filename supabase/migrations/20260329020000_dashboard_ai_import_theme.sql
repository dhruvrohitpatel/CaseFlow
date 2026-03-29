alter table public.organization_settings
  add column if not exists theme_preset_key text not null default 'day',
  add column if not exists canvas_color text not null default '#f4efe8',
  add column if not exists card_color text not null default '#ffffff',
  add column if not exists border_color text not null default '#d9d1c7',
  add column if not exists font_pair_key text not null default 'system-sans',
  add column if not exists imagery_prompt text;

update public.organization_settings
set
  theme_preset_key = coalesce(nullif(trim(theme_preset_key), ''), 'day'),
  canvas_color = coalesce(nullif(trim(canvas_color), ''), '#f4efe8'),
  card_color = coalesce(nullif(trim(card_color), ''), '#ffffff'),
  border_color = coalesce(nullif(trim(border_color), ''), '#d9d1c7'),
  font_pair_key = coalesce(nullif(trim(font_pair_key), ''), 'system-sans');

alter table public.organization_settings
  add constraint organization_settings_theme_preset_key_check
    check (theme_preset_key in ('day', 'night', 'noir', 'notepad', 'custom'));

alter table public.organization_settings
  add constraint organization_settings_font_pair_key_check
    check (font_pair_key in ('system-sans', 'editorial-serif', 'humanist-sans', 'notepad-mono'));

create table if not exists public.dashboard_role_layouts (
  id uuid primary key default gen_random_uuid(),
  role public.app_role not null unique,
  layout jsonb not null default '[]'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.dashboard_user_layout_overrides (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  role public.app_role not null,
  layout jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.dashboard_ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  target_role public.app_role not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  workflow_summary jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.import_assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  source_filename text not null,
  target_entity text not null,
  source_headers jsonb not null default '[]'::jsonb,
  mapping_plan jsonb not null default '{}'::jsonb,
  preview_rows jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_theme_drafts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  prompt text not null,
  theme_recipe jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  applied_at timestamptz
);

drop trigger if exists dashboard_role_layouts_set_updated_at on public.dashboard_role_layouts;
create trigger dashboard_role_layouts_set_updated_at
before update on public.dashboard_role_layouts
for each row
execute function public.set_updated_at();

drop trigger if exists dashboard_user_layout_overrides_set_updated_at on public.dashboard_user_layout_overrides;
create trigger dashboard_user_layout_overrides_set_updated_at
before update on public.dashboard_user_layout_overrides
for each row
execute function public.set_updated_at();

drop trigger if exists dashboard_ai_recommendations_set_updated_at on public.dashboard_ai_recommendations;
create trigger dashboard_ai_recommendations_set_updated_at
before update on public.dashboard_ai_recommendations
for each row
execute function public.set_updated_at();

drop trigger if exists import_assistant_sessions_set_updated_at on public.import_assistant_sessions;
create trigger import_assistant_sessions_set_updated_at
before update on public.import_assistant_sessions
for each row
execute function public.set_updated_at();

alter table public.dashboard_role_layouts enable row level security;
alter table public.dashboard_user_layout_overrides enable row level security;
alter table public.dashboard_ai_recommendations enable row level security;
alter table public.import_assistant_sessions enable row level security;
alter table public.organization_theme_drafts enable row level security;

drop policy if exists "authenticated can read dashboard role layouts" on public.dashboard_role_layouts;
create policy "authenticated can read dashboard role layouts"
on public.dashboard_role_layouts
for select
to authenticated
using (true);

drop policy if exists "admins can manage dashboard role layouts" on public.dashboard_role_layouts;
create policy "admins can manage dashboard role layouts"
on public.dashboard_role_layouts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read own dashboard overrides" on public.dashboard_user_layout_overrides;
create policy "users can read own dashboard overrides"
on public.dashboard_user_layout_overrides
for select
to authenticated
using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "users can manage own dashboard overrides" on public.dashboard_user_layout_overrides;
create policy "users can manage own dashboard overrides"
on public.dashboard_user_layout_overrides
for all
to authenticated
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "users can read own dashboard recommendations" on public.dashboard_ai_recommendations;
create policy "users can read own dashboard recommendations"
on public.dashboard_ai_recommendations
for select
to authenticated
using (created_by = auth.uid() or profile_id = auth.uid() or public.is_admin());

drop policy if exists "users can create dashboard recommendations" on public.dashboard_ai_recommendations;
create policy "users can create dashboard recommendations"
on public.dashboard_ai_recommendations
for insert
to authenticated
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "users can update dashboard recommendations" on public.dashboard_ai_recommendations;
create policy "users can update dashboard recommendations"
on public.dashboard_ai_recommendations
for update
to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "admins manage import assistant sessions" on public.import_assistant_sessions;
create policy "admins manage import assistant sessions"
on public.import_assistant_sessions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage theme drafts" on public.organization_theme_drafts;
create policy "admins manage theme drafts"
on public.organization_theme_drafts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.dashboard_role_layouts (role, layout)
values
  (
    'admin',
    '[
      {"id":"metric_active_clients","key":"metric_active_clients","size":"md"},
      {"id":"metric_services_week","key":"metric_services_week","size":"md"},
      {"id":"metric_services_month","key":"metric_services_month","size":"md"},
      {"id":"metric_services_quarter","key":"metric_services_quarter","size":"md"},
      {"id":"access_overview","key":"access_overview","size":"md"},
      {"id":"semantic_search","key":"semantic_search","size":"full"},
      {"id":"service_mix_chart","key":"service_mix_chart","size":"lg"},
      {"id":"visit_trend_chart","key":"visit_trend_chart","size":"lg"},
      {"id":"exports_panel","key":"exports_panel","size":"md"},
      {"id":"admin_controls","key":"admin_controls","size":"md"}
    ]'::jsonb
  ),
  (
    'staff',
    '[
      {"id":"appointments_today_metric","key":"appointments_today_metric","size":"md"},
      {"id":"active_clients_metric","key":"metric_active_clients","size":"md"},
      {"id":"recent_service_logs_metric","key":"recent_service_logs_metric","size":"md"},
      {"id":"quick_actions","key":"quick_actions","size":"md"},
      {"id":"semantic_search","key":"semantic_search","size":"full"},
      {"id":"appointments_today_list","key":"appointments_today_list","size":"lg"},
      {"id":"recent_clients_list","key":"recent_clients_list","size":"md"},
      {"id":"recent_service_activity_list","key":"recent_service_activity_list","size":"md"}
    ]'::jsonb
  ),
  (
    'client',
    '[
      {"id":"client_case_status","key":"client_case_status","size":"md"},
      {"id":"client_upcoming_appointments","key":"client_upcoming_appointments","size":"md"},
      {"id":"client_recent_activity_metric","key":"client_recent_activity_metric","size":"md"},
      {"id":"client_last_interaction","key":"client_last_interaction","size":"md"},
      {"id":"client_support_panel","key":"client_support_panel","size":"md"},
      {"id":"client_next_appointment","key":"client_next_appointment","size":"md"},
      {"id":"client_recent_activity_list","key":"client_recent_activity_list","size":"full"}
    ]'::jsonb
  )
on conflict (role) do nothing;
