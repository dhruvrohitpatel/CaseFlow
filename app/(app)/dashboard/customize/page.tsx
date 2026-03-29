import Link from "next/link";

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

function resolveCustomizeError(error?: string, message?: string) {
  if (message?.trim()) {
    return message;
  }

  switch (error) {
    case "admin-ai-disabled":
      return "Premium admin AI is not enabled for this workspace.";
    case "recommendation-fields":
      return "Complete every workflow field before requesting a recommendation.";
    case "recommendation-unavailable":
      return "Premium admin AI is unavailable right now. Use the manual workflow for now.";
    default:
      return error ? "Dashboard action failed. Review the inputs and try again." : null;
  }
}

function parseRole(value: string | undefined, fallback: DashboardRole): DashboardRole {
  if (value === "admin" || value === "staff" || value === "client") {
    return value;
  }

  return fallback;
}

export default async function CustomizeDashboardPage({
  searchParams,
}: CustomizePageProps) {
  const [{ profile }, params] = await Promise.all([requireAppSession(), searchParams]);
  const adminAi = getAiFeatureState("admin_ai");
  const scope = params.scope === "role" && profile.role === "admin" ? "role" : "personal";
  const targetRole = parseRole(params.targetRole, profile.role);
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
          Dashboard layout saved.
        </div>
      ) : null}
      {params.reset === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Personal layout reset to the role default.
        </div>
      ) : null}
      {params.recommended === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Widget recommendations generated.
        </div>
      ) : null}
      {params.applied === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Recommended widget bundle applied.
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
            Customize dashboard
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Build a governed layout with configurable widgets, drill-through charts, and optional AI add-ons.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href={getDashboardPathForRole(targetRole)}>
            Open dashboard
          </Link>
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/admin/import-assistant">
            Import assistant
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Included in base</Badge>
        <Badge variant="outline">{adminAi.planLabel}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className={`inline-flex rounded-full px-3 py-2 text-sm font-medium ${scope === "personal" ? "brand-primary-button" : "border border-stone-200 bg-white text-stone-900"}`} href={`/dashboard/customize?scope=personal&targetRole=${profile.role}`}>
          My dashboard
        </Link>
        {profile.role === "admin"
          ? (["admin", "staff", "client"] as DashboardRole[]).map((role) => (
              <Link
                key={role}
                className={`inline-flex rounded-full px-3 py-2 text-sm font-medium ${scope === "role" && targetRole === role ? "brand-primary-button" : "border border-stone-200 bg-white text-stone-900"}`}
                href={`/dashboard/customize?scope=role&targetRole=${role}`}
              >
                {role} default
              </Link>
            ))
          : null}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>
              {scope === "role" ? `${targetRole} default layout` : "Personal layout"}
            </CardTitle>
            <CardDescription>
              {scope === "role"
                ? "Changes here affect the default layout for this role."
                : effectiveLayout.usingOverride
                  ? "This view overrides the role default for your account."
                  : "You are currently using the role default layout."}
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
                        {definition?.description ?? "Configured widget"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={moveDashboardWidgetAction}>
                        <input name="scope" type="hidden" value={scope} />
                        <input name="targetRole" type="hidden" value={targetRole} />
                        <input name="widgetId" type="hidden" value={widget.id} />
                        <input name="direction" type="hidden" value="up" />
                        <Button disabled={index === 0} size="sm" type="submit" variant="outline">
                          Up
                        </Button>
                      </form>
                      <form action={moveDashboardWidgetAction}>
                        <input name="scope" type="hidden" value={scope} />
                        <input name="targetRole" type="hidden" value={targetRole} />
                        <input name="widgetId" type="hidden" value={widget.id} />
                        <input name="direction" type="hidden" value="down" />
                        <Button disabled={index === effectiveLayout.layout.length - 1} size="sm" type="submit" variant="outline">
                          Down
                        </Button>
                      </form>
                      <form action={resizeDashboardWidgetAction} className="flex items-center gap-2">
                        <input name="scope" type="hidden" value={scope} />
                        <input name="targetRole" type="hidden" value={targetRole} />
                        <input name="widgetId" type="hidden" value={widget.id} />
                        <select className="h-9 rounded-lg border border-stone-200 bg-white px-2 text-sm" defaultValue={widget.size} name="size">
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                          <option value="full">Full</option>
                        </select>
                        <Button size="sm" type="submit" variant="outline">Resize</Button>
                      </form>
                      <form action={removeDashboardWidgetAction}>
                        <input name="scope" type="hidden" value={scope} />
                        <input name="targetRole" type="hidden" value={targetRole} />
                        <input name="widgetId" type="hidden" value={widget.id} />
                        <Button className="text-red-700 hover:bg-red-50 hover:text-red-800" size="sm" type="submit" variant="ghost">
                          Remove
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
                <Button type="submit" variant="outline">Reset to role default</Button>
              </form>
            ) : (
              <div className="rounded-xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-4 py-3 text-sm text-stone-600">
                The current saved default contains {roleLayout.length} widgets for the {targetRole} role.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>Add widgets</CardTitle>
              <CardDescription>Add a governed widget from the approved catalog.</CardDescription>
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
                      <Button size="sm" type="submit">Add</Button>
                    </form>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>Add custom chart</CardTitle>
              <CardDescription>Choose a supported dataset, metric, dimension, and timeframe.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={addDashboardWidgetAction} className="space-y-4">
                <input name="scope" type="hidden" value={scope} />
                <input name="targetRole" type="hidden" value={targetRole} />
                <input name="widgetKey" type="hidden" value="custom_chart" />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-950" htmlFor="title">Chart title</label>
                  <input className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950" id="title" name="title" placeholder="Housing status by month" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="dataSource">Data source</label>
                    <select className={nativeSelectClassName} id="dataSource" name="dataSource">
                      <option value="clients">Clients</option>
                      <option value="service_entries">Service entries</option>
                      <option value="appointments">Appointments</option>
                      {targetRole === "admin" ? <option value="access_allowlist">Access</option> : null}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="chartType">Chart type</label>
                    <select className={nativeSelectClassName} id="chartType" name="chartType">
                      <option value="bar">Bar</option>
                      <option value="line">Line</option>
                      <option value="table">Table</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="metric">Metric</label>
                    <select className={nativeSelectClassName} id="metric" name="metric">
                      <option value="count">Count</option>
                      <option value="unique_clients">Unique clients</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="dimension">Dimension</label>
                    <select className={nativeSelectClassName} id="dimension" name="dimension">
                      <option value="status">Status</option>
                      <option value="service_type">Service type</option>
                      <option value="housing_status">Housing status</option>
                      <option value="referral_source">Referral source</option>
                      <option value="preferred_language">Language</option>
                      <option value="reminder_status">Reminder status</option>
                      <option value="staff_member_name">Staff member</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="day">Day</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-950" htmlFor="timeframe">Timeframe</label>
                  <select className={nativeSelectClassName} id="timeframe" name="timeframe">
                    <option value="today">Today</option>
                    <option value="this_week">This week</option>
                    <option value="this_month">This month</option>
                    <option value="this_quarter">This quarter</option>
                    <option value="last_8_weeks">Last 8 weeks</option>
                    <option value="all_time">All time</option>
                  </select>
                </div>
                <Button type="submit">Add custom chart</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>AI suggestions</CardTitle>
              <CardDescription>
                {adminAi.enabled
                  ? "Describe the role and daily work. CaseFlow will recommend widgets and explain why they matter."
                  : "Manual widget selection is included in base. AI suggestions are optional and available as premium admin AI."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminAi.enabled ? (
                <form action={generateDashboardRecommendationAction} className="space-y-4">
                  <input name="scope" type="hidden" value={scope} />
                  <input name="targetRole" type="hidden" value={targetRole} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="jobTitle">Job role</label>
                    <input className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950" id="jobTitle" name="jobTitle" placeholder="Program director" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="dayToDay">Day-to-day work</label>
                    <textarea className="min-h-24 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950" id="dayToDay" name="dayToDay" placeholder="Review caseload, manage staff workload, track open referrals..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-950" htmlFor="decisions">Most frequent decisions</label>
                    <textarea className="min-h-20 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950" id="decisions" name="decisions" placeholder="Where to allocate staff, which clients need follow-up, which program is over capacity..." />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-950" htmlFor="reportingCadence">Reporting cadence</label>
                      <input className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950" id="reportingCadence" name="reportingCadence" placeholder="Daily + weekly" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-950" htmlFor="painPoints">Pain points</label>
                      <input className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950" id="painPoints" name="painPoints" placeholder="Too many tabs, slow follow-up visibility" />
                    </div>
                  </div>
                  <Button type="submit">Generate widget suggestions</Button>
                </form>
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-5 py-6 text-sm text-stone-600">
                  Premium admin AI can suggest widget bundles from the approved catalog. The base plan still includes role defaults, personal overrides, and manual widget editing.
                </div>
              )}

              {recommendationsResult.data?.map((recommendation) => (
                <div key={recommendation.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-950">
                        Suggested for {recommendation.target_role}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {new Date(recommendation.created_at).toLocaleString()}
                      </p>
                    </div>
                    <form action={applyDashboardRecommendationAction}>
                      <input name="scope" type="hidden" value={scope} />
                      <input name="targetRole" type="hidden" value={targetRole} />
                      <input name="recommendationId" type="hidden" value={recommendation.id} />
                      <Button size="sm" type="submit">Apply bundle</Button>
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
                                <p className="text-sm text-stone-600">Why this widget was recommended</p>
                              </div>
                              <Badge variant="outline" className="uppercase">{item.size}</Badge>
                            </div>
                          </summary>
                          <div className="mt-3 space-y-2 text-sm text-stone-600">
                            <p><strong className="text-stone-950">Trigger:</strong> {item.why.trigger}</p>
                            <p><strong className="text-stone-950">Decision supported:</strong> {item.why.supporting_decision}</p>
                            <p><strong className="text-stone-950">Dataset:</strong> {item.why.dataset}</p>
                            <p><strong className="text-stone-950">Expected usage:</strong> {item.why.frequency}</p>
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
