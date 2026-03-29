import { z } from "zod";

import type { Database, Json } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DashboardRole = Database["public"]["Enums"]["app_role"];

export const widgetSizeSchema = z.enum(["sm", "md", "lg", "full"]);
export const chartTypeSchema = z.enum(["bar", "line", "table"]);
export const dataSourceSchema = z.enum([
  "clients",
  "service_entries",
  "appointments",
  "access_allowlist",
]);
export const metricSchema = z.enum([
  "count",
  "active_count",
  "unique_clients",
  "appointment_count",
  "service_count",
  "average_per_bucket",
]);
export const dimensionSchema = z.enum([
  "status",
  "service_type",
  "housing_status",
  "referral_source",
  "preferred_language",
  "reminder_status",
  "staff_member_name",
  "week",
  "month",
  "day",
]);
export const timeframeSchema = z.enum([
  "all_time",
  "today",
  "this_week",
  "this_month",
  "this_quarter",
    "last_8_weeks",
]);

export const dashboardWidgetSchema = z.object({
  config: z
    .object({
      chartType: chartTypeSchema.optional(),
      dataSource: dataSourceSchema.optional(),
      dimension: dimensionSchema.optional(),
      metric: metricSchema.optional(),
      timeframe: timeframeSchema.optional(),
      title: z.string().optional(),
    })
    .optional(),
  id: z.string().min(1),
  key: z.string().min(1),
  size: widgetSizeSchema.default("md"),
});

export type DashboardWidget = z.infer<typeof dashboardWidgetSchema>;

const dashboardLayoutSchema = z.array(dashboardWidgetSchema);

export type DashboardCatalogItem = {
  defaultSize: DashboardWidget["size"];
  description: string;
  interactive: boolean;
  key: string;
  label: string;
  roles: DashboardRole[];
  supportsCustomConfig?: boolean;
};

export const dashboardCatalog: DashboardCatalogItem[] = [
  {
    defaultSize: "md",
    description: "Count of active client records.",
    interactive: true,
    key: "metric_active_clients",
    label: "Active clients",
    roles: ["admin", "staff"],
  },
  {
    defaultSize: "md",
    description: "Count of service entries in the current week.",
    interactive: true,
    key: "metric_services_week",
    label: "Services this week",
    roles: ["admin"],
  },
  {
    defaultSize: "md",
    description: "Count of service entries in the current month.",
    interactive: true,
    key: "metric_services_month",
    label: "Services this month",
    roles: ["admin"],
  },
  {
    defaultSize: "md",
    description: "Count of service entries in the current quarter.",
    interactive: true,
    key: "metric_services_quarter",
    label: "Services this quarter",
    roles: ["admin"],
  },
  {
    defaultSize: "md",
    description: "Approved staff/admin and client portal counts.",
    interactive: true,
    key: "access_overview",
    label: "Access overview",
    roles: ["admin"],
  },
  {
    defaultSize: "full",
    description: "Natural-language search across internal service notes.",
    interactive: true,
    key: "semantic_search",
    label: "Semantic search",
    roles: ["admin", "staff"],
  },
  {
    defaultSize: "lg",
    description: "Service activity by service type.",
    interactive: true,
    key: "service_mix_chart",
    label: "Service mix",
    roles: ["admin"],
  },
  {
    defaultSize: "lg",
    description: "Trend view across recent service activity.",
    interactive: true,
    key: "visit_trend_chart",
    label: "Visit trend",
    roles: ["admin"],
  },
  {
    defaultSize: "md",
    description: "Links to exports and report actions.",
    interactive: true,
    key: "exports_panel",
    label: "Exports",
    roles: ["admin"],
  },
  {
    defaultSize: "md",
    description: "Links to admin controls and setup.",
    interactive: true,
    key: "admin_controls",
    label: "Admin controls",
    roles: ["admin"],
  },
  {
    defaultSize: "md",
    description: "Appointments scheduled for today.",
    interactive: true,
    key: "appointments_today_metric",
    label: "Appointments today",
    roles: ["staff"],
  },
  {
    defaultSize: "md",
    description: "Recent logged service count.",
    interactive: true,
    key: "recent_service_logs_metric",
    label: "Recent service logs",
    roles: ["staff"],
  },
  {
    defaultSize: "md",
    description: "Direct links to staff tasks.",
    interactive: true,
    key: "quick_actions",
    label: "Quick actions",
    roles: ["staff"],
  },
  {
    defaultSize: "lg",
    description: "Same-day appointments grouped in one list.",
    interactive: true,
    key: "appointments_today_list",
    label: "Today's appointments",
    roles: ["staff"],
  },
  {
    defaultSize: "md",
    description: "Most recently added clients.",
    interactive: true,
    key: "recent_clients_list",
    label: "Recent clients",
    roles: ["staff"],
  },
  {
    defaultSize: "md",
    description: "Latest logged interactions across the team.",
    interactive: true,
    key: "recent_service_activity_list",
    label: "Recent service activity",
    roles: ["staff"],
  },
  {
    defaultSize: "md",
    description: "Current portal case status.",
    interactive: true,
    key: "client_case_status",
    label: "Case status",
    roles: ["client"],
  },
  {
    defaultSize: "md",
    description: "Count of upcoming appointments.",
    interactive: true,
    key: "client_upcoming_appointments",
    label: "Upcoming appointments",
    roles: ["client"],
  },
  {
    defaultSize: "md",
    description: "Recent activity count without internal note content.",
    interactive: true,
    key: "client_recent_activity_metric",
    label: "Recent activity",
    roles: ["client"],
  },
  {
    defaultSize: "md",
    description: "Date of the last recorded interaction.",
    interactive: true,
    key: "client_last_interaction",
    label: "Last interaction",
    roles: ["client"],
  },
  {
    defaultSize: "md",
    description: "Support contact and next steps.",
    interactive: true,
    key: "client_support_panel",
    label: "Support panel",
    roles: ["client"],
  },
  {
    defaultSize: "md",
    description: "Details for the next scheduled appointment.",
    interactive: true,
    key: "client_next_appointment",
    label: "Next appointment",
    roles: ["client"],
  },
  {
    defaultSize: "full",
    description: "Client-safe recent activity timeline.",
    interactive: true,
    key: "client_recent_activity_list",
    label: "Recent activity list",
    roles: ["client"],
  },
  {
    defaultSize: "lg",
    description: "Build a chart from approved datasets, dimensions, and timeframes.",
    interactive: true,
    key: "custom_chart",
    label: "Custom chart",
    roles: ["admin", "staff", "client"],
    supportsCustomConfig: true,
  },
];

export const defaultRoleLayouts: Record<DashboardRole, DashboardWidget[]> = {
  admin: [
    { id: "metric_active_clients", key: "metric_active_clients", size: "md" },
    { id: "metric_services_week", key: "metric_services_week", size: "md" },
    { id: "metric_services_month", key: "metric_services_month", size: "md" },
    { id: "metric_services_quarter", key: "metric_services_quarter", size: "md" },
    { id: "access_overview", key: "access_overview", size: "md" },
    { id: "semantic_search", key: "semantic_search", size: "full" },
    { id: "service_mix_chart", key: "service_mix_chart", size: "lg" },
    { id: "visit_trend_chart", key: "visit_trend_chart", size: "lg" },
    { id: "exports_panel", key: "exports_panel", size: "md" },
    { id: "admin_controls", key: "admin_controls", size: "md" },
  ],
  client: [
    { id: "client_case_status", key: "client_case_status", size: "md" },
    {
      id: "client_upcoming_appointments",
      key: "client_upcoming_appointments",
      size: "md",
    },
    {
      id: "client_recent_activity_metric",
      key: "client_recent_activity_metric",
      size: "md",
    },
    { id: "client_last_interaction", key: "client_last_interaction", size: "md" },
    { id: "client_support_panel", key: "client_support_panel", size: "md" },
    { id: "client_next_appointment", key: "client_next_appointment", size: "md" },
    {
      id: "client_recent_activity_list",
      key: "client_recent_activity_list",
      size: "full",
    },
  ],
  staff: [
    {
      id: "appointments_today_metric",
      key: "appointments_today_metric",
      size: "md",
    },
    { id: "metric_active_clients", key: "metric_active_clients", size: "md" },
    {
      id: "recent_service_logs_metric",
      key: "recent_service_logs_metric",
      size: "md",
    },
    { id: "quick_actions", key: "quick_actions", size: "md" },
    { id: "semantic_search", key: "semantic_search", size: "full" },
    { id: "appointments_today_list", key: "appointments_today_list", size: "lg" },
    { id: "recent_clients_list", key: "recent_clients_list", size: "md" },
    {
      id: "recent_service_activity_list",
      key: "recent_service_activity_list",
      size: "md",
    },
  ],
};

function parseLayout(layout: Json | null | undefined, fallback: DashboardWidget[]) {
  const parsed = dashboardLayoutSchema.safeParse(layout ?? fallback);

  return parsed.success ? parsed.data : fallback;
}

export function getCatalogForRole(role: DashboardRole) {
  return dashboardCatalog.filter((item) => item.roles.includes(role));
}

export async function getStoredRoleLayout(role: DashboardRole) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dashboard_role_layouts")
    .select("layout")
    .eq("role", role)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return parseLayout(data?.layout, defaultRoleLayouts[role]);
}

export async function getUserDashboardOverride(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dashboard_user_layout_overrides")
    .select("layout, role")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    layout: parseLayout(data.layout, defaultRoleLayouts[data.role]),
    role: data.role,
  };
}

export async function getEffectiveDashboardLayout(role: DashboardRole, profileId: string) {
  const [override, roleLayout] = await Promise.all([
    getUserDashboardOverride(profileId),
    getStoredRoleLayout(role),
  ]);

  return {
    layout: override?.layout ?? roleLayout,
    roleLayout,
    usingOverride: Boolean(override),
  };
}

export async function saveRoleLayout(
  role: DashboardRole,
  layout: DashboardWidget[],
  updatedBy: string,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("dashboard_role_layouts").upsert({
    layout,
    role,
    updated_by: updatedBy,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveUserLayout(
  profileId: string,
  role: DashboardRole,
  layout: DashboardWidget[],
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("dashboard_user_layout_overrides").upsert({
    layout,
    profile_id: profileId,
    role,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function resetUserLayout(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("dashboard_user_layout_overrides")
    .delete()
    .eq("profile_id", profileId);

  if (error) {
    throw new Error(error.message);
  }
}

export function getWidgetDefinition(key: string) {
  return dashboardCatalog.find((item) => item.key === key) ?? null;
}

export function withMovedWidget(
  layout: DashboardWidget[],
  widgetId: string,
  direction: "up" | "down",
) {
  const index = layout.findIndex((widget) => widget.id === widgetId);

  if (index === -1) {
    return layout;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= layout.length) {
    return layout;
  }

  const next = [...layout];
  const [widget] = next.splice(index, 1);
  next.splice(targetIndex, 0, widget);
  return next;
}

export function withRemovedWidget(layout: DashboardWidget[], widgetId: string) {
  return layout.filter((widget) => widget.id !== widgetId);
}

export function withResizedWidget(
  layout: DashboardWidget[],
  widgetId: string,
  size: DashboardWidget["size"],
) {
  return layout.map((widget) =>
    widget.id === widgetId ? { ...widget, size } : widget,
  );
}

export function withAddedWidget(
  layout: DashboardWidget[],
  widget: DashboardWidget,
) {
  return [...layout, widget];
}
