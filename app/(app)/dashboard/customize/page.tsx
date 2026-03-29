import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  addDashboardWidgetAction,
  applyDashboardRecommendationAction,
  generateDashboardRecommendationAction,
  moveDashboardWidgetAction,
  removeDashboardWidgetAction,
  resetPersonalDashboardAction,
  resizeDashboardWidgetAction,
} from "@/app/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAiFeatureState } from "@/lib/ai/capabilities";
import { getDashboardPathForRole, requireAppSession } from "@/lib/auth";
import {
  dashboardCatalog,
  getCatalogForRole,
  getEffectiveDashboardLayout,
  getStoredRoleLayout,
  type DashboardRole,
} from "@/lib/dashboard-layouts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const nativeSelectClassName =
  "flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

type CustomizePageProps = {
  searchParams: Promise<{
    applied?: string;
    error?: string;
    message?: string;
    recommended?: string;
    reset?: string;
    saved?: string;
    scope?: string;
    targetRole?: string;
  }>;
};

function parseRole(value: string | undefined, fallback: DashboardRole): DashboardRole {
  if (value === "admin" || value === "staff" || value === "client") {
    return value;
  }

  return fallback;
}

export default async function CustomizeDashboardPage({
  searchParams,
}: CustomizePageProps) {
  const [{ profile }, params, t] = await Promise.all([requireAppSession(), searchParams, getTranslations("CustomizeDashboardPage")]);
  const adminAi = getAiFeatureState("admin_ai");
  const scope = params.scope === "role" && profile.role === "admin" ? "role" : "personal";
  const targetRole = parseRole(params.targetRole, profile.role);

  function resolveCustomizeError(error?: string, message?: string) {
    if (message?.trim()) {
      return message;
    }

    switch (error) {
      case "admin-ai-disabled":
        return t("errorAdminAiDisabled");
      case "recommendation-fields":
        return t("errorRecommendationFields");
      case "recommendation-unavailable":
        return t("errorRecommendationUnavailable");
      default:
        return error ? t("errorGeneric") : null;
    }
  }

  const [effectiveLayout, roleLayout, recommendationsResult] = await Promise.all([
    scope === "personal"
      ? getEffectiveDashboardLayout(targetRole, profile.id)
      : Promise.resolve({
          layout: await getStoredRoleLayout(targetRole),
          roleLayout: await getStoredRoleLayout(targetRole),
          usingOverride: false,
        }),
    getStoredRoleLayout(targetRole),
    createSupabaseAdminClient()
      .from("dashboard_ai_recommendations")
      .select("id, recommendations, workflow_summary, created_at, target_role, profile_id")
      .eq("target_role", targetRole)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (recommendationsResult.error) {
    throw new Error(recommendationsResult.error.message);
  }

  const catalog = getCatalogForRole(targetRole);
  const errorMessage = resolveCustomizeError(params.error, params.message);

  return (
    <div className="space-y-6">
      {params.saved === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("successSaved")}
        </div>
      ) : null}
      {params.reset === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("successReset")}
        </div>
      ) : null}
      {params.recommended === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("successRecommended")}
        </div>
      ) : null}
      {params.applied === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("successApplied")}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            {t("pageTitle")}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            {t("pageDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href={getDashboardPathForRole(targetRole)}>
            {t("openDashboard")}
          </Link>
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/admin/import-assistant">
            {t("importAssistant")}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{t("includedInBase")}</Badge>
        <Badge variant="outline">{adminAi.planLabel}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className={`inline-flex rounded-full px-3 py-2 text-sm font-medium ${scope === "personal" ? "brand-primary-button" : "border border-stone-200 bg-white text-stone-900"}`} href={`/dashboard/customize?scope=personal&targetRole=${profile.role}`}>
          {t("myDashboard")}
        </Link>
        {profile.role === "admin"
          ? (["admin", "staff", "client"] as DashboardRole[]).map((role) => (
              <Link
                key={role}
                className={`inline-flex rounded-full px-3 py-2 text-sm font-medium ${scope === "role" && targetRole === role ? "brand-primary-button" : "border border-stone-200 bg-white text-stone-900"}`}
                href={`/dashboard/customize?scope=role&targetRole=${role}`}
              >
                {t("roleDefault", { role })}
              </Link>
            ))
          : null}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>
              {scope === "role" ? t("layoutTitleRole", { role: targetRole }) : t("layoutTitlePersonal")}
            </CardTitle>
            <CardDescription>
              {scope === "role"
                ? t("layoutDescRole")
                : effectiveLayout.usingOverride
                  ? t("layoutDescPersonalOverride")
                  : t("layoutDescPersonalDefault")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {effectiveLayout.layout.map((widget, index) => {
              const definition = dashboardCatalog.find((item) => item.key === widget.key);

              return (
                <div key={widget.id} className="rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.5)] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-stone-950">
                          {widget.config?.title || definition?.label || widget.key}
                        </p>
                        <Badge variant="outline" className="uppercase">{widget.size}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-stone-600">
                        {definition?.description ?? t("configuredWidget")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={moveDashboardWidgetAction}>
                        <input name="scope" type="hidden" value={scope} />
                        <input name="targetRole" type="hidden" value={targetRole} />
                        <input name="widgetId" type="hidden" value={widget.id} />
                        <input name="direction" type="hidden" value="up" />
                        <Button disabled={index === 0} size="sm" type="submit" variant="outline">
                          {t("moveUp")}
                        </Button>
                      </form>
                      <form action={moveDashboardWidgetAction}>
                        <input name="scope" type="hidden" value={scope} />
                        <input name="targetRole" type="hidden" value={targetRole} />
                        <input name="widgetId" type="hidden" value={widget.id} />
                        <input name="direction" type="hidden" value="down" />
                        <Button disabled={index === effectiveLayout.layout.length - 1} size="sm" type="submit" variant="outline">
                          {t("moveDown")}
                        </Button>
                      </form>
                      <form action={resizeDashboardWidgetAction} className="flex items-center gap-2">
                        <input name="scope" type="hidden" value={scope} />
                        <input name="targetRole" type="hidden" value={targetRole} />
                        <input name="widgetId" type="hidden" value={widget.id} />
                        <select className="h-9 rounded-lg border border-stone-200 bg-white px-2 text-sm" defaultValue={widget.size} name="size">
                          <option value="sm">{t("sizeSmall")}</option>
                          <option value="md">{t("sizeMedium")}</option>
                          <option value="lg">{t("sizeLarge")}</option>
                          <option value="full">{t("sizeFull")}</option>
                        </select>
                        <Button size="sm" type="submit" variant="outline">{t("resizeButton")}</Button>
                      </form>
                      <form action={removeDashboardWidgetAction}>
                        <input name="scope" type="hidden" value={scope} />
                        <input name="targetRole" type="hidden" value={targetRole} />
                        <input name="widgetId" type="hidden" value={widget.id} />
                        <Button className="text-red-700 hover:bg-red-50 hover:text-red-800" size="sm" type="submit" variant="ghost">
                          {t("removeButton")}
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}

            {scope === "personal" ? (
              <form action={resetPersonalDashboardAction}>
                <input name="targetRole" type="hidden" value={targetRole} />
                <Button type="submit" variant="outline">{t("resetToDefault")}</Button>
              </form>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-4 py-3 text-sm text-stone-600">
                {t("savedDefaultSummary", { count: roleLayout.length, role: targetRole })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>{t("addWidgetsTitle")}</CardTitle>
              <CardDescription>{t("addWidgetsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {catalog.filter((item) => !item.supportsCustomConfig).map((item) => (
                <div key={item.key} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-950">{item.label}</p>
                      <p className="mt-2 text-sm text-stone-600">{item.description}</p>
                    </div>
                    <form action={addDashboardWidgetAction}>
                      <input name="scope" type="hidden" value={scope} />
                      <input name="targetRole" type="hidden" value={targetRole} />
                      <input name="widgetKey" type="hidden" value={item.key} />
                      <Button size="sm" type="submit">{t("addButton")}</Button>
                    </form>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>{t("customChartTitle")}</CardTitle>
              <CardDescription>{t("customChartDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={addDashboardWidgetAction} className="space-y-4">
                <input name="scope" type="hidden" value={scope} />
                <input name="targetRole" type="hidden" value={targetRole} />
                <input name="widgetKey" type="hidden" value="custom_chart" />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-950" htmlFor="title">{t("chartTitleLabel")}</label>
                  <input className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950" id="title" name="title" placeholder={t("chartTitlePlaceholder")} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="dataSource">{t("dataSourceLabel")}</label>
                    <select className={nativeSelectClassName} id="dataSource" name="dataSource">
                      <option value="clients">{t("dataSourceClients")}</option>
                      <option value="service_entries">{t("dataSourceServiceEntries")}</option>
                      <option value="appointments">{t("dataSourceAppointments")}</option>
                      {targetRole === "admin" ? <option value="access_allowlist">{t("dataSourceAccess")}</option> : null}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="chartType">{t("chartTypeLabel")}</label>
                    <select className={nativeSelectClassName} id="chartType" name="chartType">
                      <option value="bar">{t("chartTypeBar")}</option>
                      <option value="line">{t("chartTypeLine")}</option>
                      <option value="table">{t("chartTypeTable")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="metric">{t("metricLabel")}</label>
                    <select className={nativeSelectClassName} id="metric" name="metric">
                      <option value="count">{t("metricCount")}</option>
                      <option value="unique_clients">{t("metricUniqueClients")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="dimension">{t("dimensionLabel")}</label>
                    <select className={nativeSelectClassName} id="dimension" name="dimension">
                      <option value="status">{t("dimensionStatus")}</option>
                      <option value="service_type">{t("dimensionServiceType")}</option>
                      <option value="housing_status">{t("dimensionHousingStatus")}</option>
                      <option value="referral_source">{t("dimensionReferralSource")}</option>
                      <option value="preferred_language">{t("dimensionPreferredLanguage")}</option>
                      <option value="reminder_status">{t("dimensionReminderStatus")}</option>
                      <option value="staff_member_name">{t("dimensionStaffMember")}</option>
                      <option value="week">{t("dimensionWeek")}</option>
                      <option value="month">{t("dimensionMonth")}</option>
                      <option value="day">{t("dimensionDay")}</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-950" htmlFor="timeframe">{t("timeframeLabel")}</label>
                  <select className={nativeSelectClassName} id="timeframe" name="timeframe">
                    <option value="today">{t("timeframeToday")}</option>
                    <option value="this_week">{t("timeframeThisWeek")}</option>
                    <option value="this_month">{t("timeframeThisMonth")}</option>
                    <option value="this_quarter">{t("timeframeThisQuarter")}</option>
                    <option value="last_8_weeks">{t("timeframeLast8Weeks")}</option>
                    <option value="all_time">{t("timeframeAllTime")}</option>
                  </select>
                </div>
                <Button type="submit">{t("addCustomChartButton")}</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>{t("aiSuggestionsTitle")}</CardTitle>
              <CardDescription>
                {adminAi.enabled
                  ? t("aiSuggestionsDescriptionEnabled")
                  : t("aiSuggestionsDescriptionDisabled")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminAi.enabled ? (
                <form action={generateDashboardRecommendationAction} className="space-y-4">
                  <input name="scope" type="hidden" value={scope} />
                  <input name="targetRole" type="hidden" value={targetRole} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="jobTitle">{t("jobRoleLabel")}</label>
                    <input className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950" id="jobTitle" name="jobTitle" placeholder={t("jobRolePlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="dayToDay">{t("dayToDayLabel")}</label>
                    <textarea className="min-h-24 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950" id="dayToDay" name="dayToDay" placeholder={t("dayToDayPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="decisions">{t("decisionsLabel")}</label>
                    <textarea className="min-h-20 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950" id="decisions" name="decisions" placeholder={t("decisionsPlaceholder")} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-950" htmlFor="reportingCadence">{t("reportingCadenceLabel")}</label>
                      <input className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950" id="reportingCadence" name="reportingCadence" placeholder={t("reportingCadencePlaceholder")} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-950" htmlFor="painPoints">{t("painPointsLabel")}</label>
                      <input className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950" id="painPoints" name="painPoints" placeholder={t("painPointsPlaceholder")} />
                    </div>
                  </div>
                  <Button type="submit">{t("generateSuggestionsButton")}</Button>
                </form>
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-5 py-6 text-sm text-stone-600">
                  {t("aiDisabledHint")}
                </div>
              )}

              {recommendationsResult.data?.map((recommendation) => (
                <div key={recommendation.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-950">
                        {t("suggestedFor", { role: recommendation.target_role })}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {new Date(recommendation.created_at).toLocaleString()}
                      </p>
                    </div>
                    <form action={applyDashboardRecommendationAction}>
                      <input name="scope" type="hidden" value={scope} />
                      <input name="targetRole" type="hidden" value={targetRole} />
                      <input name="recommendationId" type="hidden" value={recommendation.id} />
                      <Button size="sm" type="submit">{t("applyBundleButton")}</Button>
                    </form>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(recommendation.recommendations as Array<{ key: string; size: string; why: { dataset: string; frequency: string; supporting_decision: string; trigger: string } }>).map((item) => {
                      const definition = dashboardCatalog.find((catalogItem) => catalogItem.key === item.key);

                      return (
                        <details key={`${recommendation.id}-${item.key}`} className="rounded-xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.35)] p-3">
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-stone-950">{definition?.label ?? item.key}</p>
                                <p className="text-sm text-stone-600">{t("whyRecommended")}</p>
                              </div>
                              <Badge variant="outline" className="uppercase">{item.size}</Badge>
                            </div>
                          </summary>
                          <div className="mt-3 space-y-2 text-sm text-stone-600">
                            <p><strong className="text-stone-950">{t("triggerLabel")}:</strong> {item.why.trigger}</p>
                            <p><strong className="text-stone-950">{t("decisionSupportedLabel")}:</strong> {item.why.supporting_decision}</p>
                            <p><strong className="text-stone-950">{t("datasetLabel")}:</strong> {item.why.dataset}</p>
                            <p><strong className="text-stone-950">{t("expectedUsageLabel")}:</strong> {item.why.frequency}</p>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
