import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { DashboardWidgetGrid } from "@/components/dashboard/dashboard-widget-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getCustomChartData, getStaffDashboardData } from "@/lib/dashboard-data";
import { getEffectiveDashboardLayout } from "@/lib/dashboard-layouts";
import { getOrganizationSettings } from "@/lib/organization-settings";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function StaffDashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { profile, supabase } = await requireRole(["admin", "staff"]);
  const [settings, params, effectiveLayout, t] = await Promise.all([
    getOrganizationSettings(),
    searchParams,
    getEffectiveDashboardLayout(profile.role, profile.id),
    getTranslations("StaffDashboard"),
  ]);
  const [staffData, customCharts] = await Promise.all([
    getStaffDashboardData(supabase),
    (async () => {
      const result: Record<string, Awaited<ReturnType<typeof getCustomChartData>>> = {};

      for (const widget of effectiveLayout.layout.filter((item) => item.key === "custom_chart")) {
        result[widget.id] = await getCustomChartData(supabase, widget, profile.role);
      }

      return result;
    })(),
  ]);

  return (
    <div className="space-y-6">
      {params.error === "unauthorized" ? (
        <div aria-live="assertive" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          {t("errorUnauthorized")}
        </div>
      ) : null}

      <Card className="brand-card border shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-2xl">
              {t("welcomeBack", { name: profile.full_name ?? t("defaultName") })}
            </CardTitle>
            <CardDescription>
              {t("description")}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/dashboard/customize?scope=personal&targetRole=staff">
              {t("customizeDashboard")}
            </Link>
            <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/clients/new">
              {t("addClient")}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-4 py-3 text-sm text-stone-600">
            {t("hint", { orgName: settings.organization_name })}
          </div>
        </CardContent>
      </Card>

      <DashboardWidgetGrid
        customCharts={customCharts}
        layout={effectiveLayout.layout}
        organizationSettings={settings}
        role="staff"
        staffData={staffData}
      />
    </div>
  );
}
