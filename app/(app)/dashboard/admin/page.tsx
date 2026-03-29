import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardWidgetGrid } from "@/components/dashboard/dashboard-widget-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData, getCustomChartData } from "@/lib/dashboard-data";
import { getEffectiveDashboardLayout } from "@/lib/dashboard-layouts";
import {
  getOrganizationSettings,
  getSetupChecklist,
  isSetupComplete,
} from "@/lib/organization-settings";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    setup?: string;
  }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: DashboardPageProps) {
  const [{ profile, supabase }, settings, params] = await Promise.all([
    requireRole(["admin"]),
    getOrganizationSettings(),
    searchParams,
  ]);
  const [adminData, { layout }, customCharts] = await Promise.all([
    getAdminDashboardData(supabase),
    getEffectiveDashboardLayout("admin", profile.id),
    (async () => {
      const result: Record<string, Awaited<ReturnType<typeof getCustomChartData>>> = {};
      const { layout } = await getEffectiveDashboardLayout("admin", profile.id);

      for (const widget of layout.filter((item) => item.key === "custom_chart")) {
        result[widget.id] = await getCustomChartData(supabase, widget, "admin");
      }

      return result;
    })(),
  ]);

  const setupChecklist = getSetupChecklist(settings);
  const completedSetupItems = setupChecklist.filter((step) => step.done).length;
  const setupComplete = isSetupComplete(settings);

  return (
    <div className="space-y-6">
      {params.error === "unauthorized" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That action is only available to admin users.
        </div>
      ) : null}
      {params.setup === "complete" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Setup completed. This workspace is ready for onboarding.
        </div>
      ) : null}

      <Card className="brand-card border shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-2xl">
              {settings.dashboard_headline ?? `Operations overview for ${settings.organization_name}.`}
            </CardTitle>
            <CardDescription>
              Configure what matters, review activity, and open the next filtered view from any widget.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/dashboard/customize?scope=role&targetRole=admin">
              Customize dashboard
            </Link>
            <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/admin/import-assistant">
              Import assistant
            </Link>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-4 py-3 text-sm text-stone-600">
            {setupComplete
              ? "Role defaults and personal overrides are active. Every chart and KPI opens a filtered detail view."
              : "Finish setup, then use the dashboard editor to tailor the admin view for the people running the program."}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Setup progress</div>
              <div className="text-lg font-semibold text-stone-950">
                {completedSetupItems}/{setupChecklist.length}
              </div>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-sm font-medium text-stone-900 hover:underline"
              href="/setup"
              prefetch={false}
            >
              Open setup
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <DashboardWidgetGrid
        adminData={adminData}
        customCharts={customCharts}
        layout={layout}
        organizationSettings={settings}
        role="admin"
      />
    </div>
  );
}
