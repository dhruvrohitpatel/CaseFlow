"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { formatAiFeatureError, getAiFeatureState } from "@/lib/ai/capabilities";
import { generateWidgetRecommendations } from "@/lib/ai/workflows";
import {
  chartTypeSchema,
  dataSourceSchema,
  defaultRoleLayouts,
  dimensionSchema,
  getCatalogForRole,
  getEffectiveDashboardLayout,
  getStoredRoleLayout,
  getWidgetDefinition,
  metricSchema,
  saveRoleLayout,
  saveUserLayout,
  type DashboardWidget,
  type DashboardRole,
  timeframeSchema,
  widgetSizeSchema,
  withAddedWidget,
  withMovedWidget,
  withRemovedWidget,
  withResizedWidget,
  resetUserLayout,
} from "@/lib/dashboard-layouts";
import { requireAppSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getScope(formData: FormData) {
  const rawScope = String(formData.get("scope") ?? "personal");

  return rawScope === "role" ? "role" : "personal";
}

function getTargetRole(formData: FormData, currentRole: DashboardRole) {
  const requestedRole = String(formData.get("targetRole") ?? currentRole) as DashboardRole;

  if (requestedRole === "admin" || requestedRole === "staff" || requestedRole === "client") {
    return requestedRole;
  }

  return currentRole;
}

function getCustomizeRedirect(scope: "personal" | "role", targetRole: DashboardRole, extra?: Record<string, string>) {
  const params = new URLSearchParams({
    scope,
    targetRole,
  });

  Object.entries(extra ?? {}).forEach(([key, value]) => params.set(key, value));

  return `/dashboard/customize?${params.toString()}`;
}

async function loadMutableLayout(scope: "personal" | "role", targetRole: DashboardRole, profileId: string) {
  if (scope === "role") {
    return getStoredRoleLayout(targetRole);
  }

  const { layout } = await getEffectiveDashboardLayout(targetRole, profileId);
  return layout;
}

async function persistMutableLayout(
  scope: "personal" | "role",
  targetRole: DashboardRole,
  profileId: string,
  layout: DashboardWidget[],
) {
  const { profile } = await requireAppSession();

  if (scope === "role") {
    if (profile.role !== "admin") {
      redirect(getCustomizeRedirect("personal", profile.role, { error: "role-scope" }));
    }

    await saveRoleLayout(targetRole, layout, profile.id);
    return;
  }

  await saveUserLayout(profileId, targetRole, layout);
}

function revalidateDashboards(targetRole: DashboardRole) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/customize");
  revalidatePath(`/dashboard/${targetRole}`);
}

export async function addDashboardWidgetAction(formData: FormData) {
  const { profile } = await requireAppSession();
  const scope = getScope(formData);
  const targetRole = getTargetRole(formData, profile.role);
  const widgetKey = String(formData.get("widgetKey") ?? "");
  const definition = getWidgetDefinition(widgetKey);

  if (!definition || !definition.roles.includes(targetRole)) {
    redirect(getCustomizeRedirect(scope, targetRole, { error: "widget" }));
  }

  const currentLayout = await loadMutableLayout(scope, targetRole, profile.id);
  const customTitle = String(formData.get("title") ?? "").trim();
  const widget: DashboardWidget = {
    config:
      widgetKey === "custom_chart"
        ? {
            chartType: chartTypeSchema.parse(String(formData.get("chartType") ?? "bar")),
            dataSource: dataSourceSchema.parse(String(formData.get("dataSource") ?? "clients")),
            dimension: dimensionSchema.parse(String(formData.get("dimension") ?? "status")),
            metric: metricSchema.parse(String(formData.get("metric") ?? "count")),
            timeframe: timeframeSchema.parse(String(formData.get("timeframe") ?? "this_month")),
            title: customTitle || undefined,
          }
        : undefined,
    id: randomUUID(),
    key: widgetKey,
    size: definition.defaultSize,
  };

  await persistMutableLayout(
    scope,
    targetRole,
    profile.id,
    withAddedWidget(currentLayout, widget),
  );
  revalidateDashboards(targetRole);
  redirect(getCustomizeRedirect(scope, targetRole, { saved: "1" }));
}

export async function moveDashboardWidgetAction(formData: FormData) {
  const { profile } = await requireAppSession();
  const scope = getScope(formData);
  const targetRole = getTargetRole(formData, profile.role);
  const widgetId = String(formData.get("widgetId") ?? "");
  const direction = String(formData.get("direction") ?? "up") === "down" ? "down" : "up";
  const currentLayout = await loadMutableLayout(scope, targetRole, profile.id);

  await persistMutableLayout(
    scope,
    targetRole,
    profile.id,
    withMovedWidget(currentLayout, widgetId, direction),
  );
  revalidateDashboards(targetRole);
  redirect(getCustomizeRedirect(scope, targetRole, { saved: "1" }));
}

export async function removeDashboardWidgetAction(formData: FormData) {
  const { profile } = await requireAppSession();
  const scope = getScope(formData);
  const targetRole = getTargetRole(formData, profile.role);
  const widgetId = String(formData.get("widgetId") ?? "");
  const currentLayout = await loadMutableLayout(scope, targetRole, profile.id);

  await persistMutableLayout(
    scope,
    targetRole,
    profile.id,
    withRemovedWidget(currentLayout, widgetId),
  );
  revalidateDashboards(targetRole);
  redirect(getCustomizeRedirect(scope, targetRole, { saved: "1" }));
}

export async function resizeDashboardWidgetAction(formData: FormData) {
  const { profile } = await requireAppSession();
  const scope = getScope(formData);
  const targetRole = getTargetRole(formData, profile.role);
  const widgetId = String(formData.get("widgetId") ?? "");
  const size = widgetSizeSchema.parse(String(formData.get("size") ?? "md"));
  const currentLayout = await loadMutableLayout(scope, targetRole, profile.id);

  await persistMutableLayout(
    scope,
    targetRole,
    profile.id,
    withResizedWidget(currentLayout, widgetId, size),
  );
  revalidateDashboards(targetRole);
  redirect(getCustomizeRedirect(scope, targetRole, { saved: "1" }));
}

export async function resetPersonalDashboardAction(formData: FormData) {
  const { profile } = await requireAppSession();
  const targetRole = getTargetRole(formData, profile.role);

  await resetUserLayout(profile.id);
  revalidateDashboards(targetRole);
  redirect(getCustomizeRedirect("personal", targetRole, { reset: "1" }));
}

export async function generateDashboardRecommendationAction(formData: FormData) {
  const { profile } = await requireAppSession();
  const scope = getScope(formData);
  const targetRole = getTargetRole(formData, profile.role);
  const adminAi = getAiFeatureState("admin_ai");

  if (scope === "role" && profile.role !== "admin") {
    redirect(getCustomizeRedirect("personal", profile.role, { error: "role-scope" }));
  }

  if (!adminAi.enabled) {
    redirect(getCustomizeRedirect(scope, targetRole, { error: "admin-ai-disabled" }));
  }

  const title = String(formData.get("jobTitle") ?? "").trim();
  const dayToDay = String(formData.get("dayToDay") ?? "").trim();
  const decisions = String(formData.get("decisions") ?? "").trim();
  const reportingCadence = String(formData.get("reportingCadence") ?? "").trim();
  const painPoints = String(formData.get("painPoints") ?? "").trim();

  if (!title || !dayToDay || !decisions || !reportingCadence || !painPoints) {
    redirect(getCustomizeRedirect(scope, targetRole, { error: "recommendation-fields" }));
  }

  let recommendations;

  try {
    recommendations = await generateWidgetRecommendations({
      catalog: getCatalogForRole(targetRole),
      dayToDay,
      decisions,
      painPoints,
      reportingCadence,
      role: targetRole,
      title,
    });
  } catch (error) {
    console.error("Dashboard recommendation generation failed:", error);
    redirect(
      getCustomizeRedirect(scope, targetRole, {
        error: "recommendation-unavailable",
        message: formatAiFeatureError("admin_ai", error),
      }),
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("dashboard_ai_recommendations").insert({
    created_by: profile.id,
    profile_id: scope === "personal" ? profile.id : null,
    recommendations: recommendations.recommendations,
    target_role: targetRole,
    workflow_summary: {
      dayToDay,
      decisions,
      painPoints,
      reportingCadence,
      title,
    },
  });

  if (error) {
    redirect(getCustomizeRedirect(scope, targetRole, { error: "recommendation-save" }));
  }

  revalidatePath("/dashboard/customize");
  redirect(getCustomizeRedirect(scope, targetRole, { recommended: "1" }));
}

export async function applyDashboardRecommendationAction(formData: FormData) {
  const { profile } = await requireAppSession();
  const scope = getScope(formData);
  const recommendationId = String(formData.get("recommendationId") ?? "");
  const targetRole = getTargetRole(formData, profile.role);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("dashboard_ai_recommendations")
    .select("recommendations, target_role")
    .eq("id", recommendationId)
    .single();

  if (error || !data) {
    redirect(getCustomizeRedirect(scope, targetRole, { error: "recommendation-load" }));
  }

  const nextLayout = (data.recommendations as Array<{ key: string; size: "sm" | "md" | "lg" | "full"; title?: string }>)
    .filter((item) => getWidgetDefinition(item.key)?.roles.includes(data.target_role))
    .map((item) => ({
      config: item.key === "custom_chart" ? { title: item.title } : undefined,
      id: randomUUID(),
      key: item.key,
      size: item.size,
    }));

  await persistMutableLayout(
    scope,
    data.target_role,
    profile.id,
    nextLayout.length > 0 ? nextLayout : defaultRoleLayouts[data.target_role],
  );
  revalidateDashboards(data.target_role);
  redirect(getCustomizeRedirect(scope, data.target_role, { applied: "1" }));
}
