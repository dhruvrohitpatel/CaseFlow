import Link from "next/link";

import { DashboardWidgetGrid } from "@/components/dashboard/dashboard-widget-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPortalClientForCurrentUser } from "@/lib/auth";
import { getClientDashboardData, getCustomChartData } from "@/lib/dashboard-data";
import { getEffectiveDashboardLayout } from "@/lib/dashboard-layouts";
import { getOrganizationSettings } from "@/lib/organization-settings";

export default async function ClientDashboardPage() {
  const { client, profile, supabase } = await getPortalClientForCurrentUser();
  const [settings, effectiveLayout] = await Promise.all([
    getOrganizationSettings(),
    getEffectiveDashboardLayout("client", profile.id),
  ]);
  const [clientData, customCharts] = await Promise.all([
    getClientDashboardData(supabase, client.id),
    (async () => {
      const result: Record<string, Awaited<ReturnType<typeof getCustomChartData>>> = {};

      for (const widget of effectiveLayout.layout.filter((item) => item.key === "custom_chart")) {
        result[widget.id] = await getCustomChartData(supabase, widget, "client", {
          clientId: client.id,
        });
      }

      return result;
    })(),
  ]);

  return (
    <div className="space-y-6">
      <Card className="brand-card border shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-2xl">
              Welcome, {client.preferred_name ?? client.full_name}.
            </CardTitle>
            <CardDescription>
              Review your current status, upcoming appointments, and recent activity in one portal.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/dashboard/customize?scope=personal&targetRole=client">
              Customize dashboard
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-4 py-3 text-sm text-stone-600">
            This dashboard only uses client-safe data. Internal case notes remain hidden.
          </div>
        </CardContent>
      </Card>

      <DashboardWidgetGrid
        clientData={clientData}
        clientRecord={{
          full_name: client.full_name,
          preferred_name: client.preferred_name,
          status: client.status,
        }}
        customCharts={customCharts}
        layout={effectiveLayout.layout}
        organizationSettings={settings}
        role={profile.role}
      />
    </div>
  );
}
