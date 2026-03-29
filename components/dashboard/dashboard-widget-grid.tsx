import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, CalendarClock, Download, Printer, UserRoundPlus, Users } from "lucide-react";

import { getAiFeatureState } from "@/lib/ai/capabilities";
import type {
  AdminDashboardData,
  ClientDashboardData,
  CustomChartData,
  StaffDashboardData,
} from "@/lib/dashboard-data";
import type { DashboardRole, DashboardWidget } from "@/lib/dashboard-layouts";
import type { OrganizationSettings } from "@/lib/organization-settings";
import { InteractiveBarChart } from "@/components/dashboard/interactive-bar-chart";
import { InteractiveLineChart } from "@/components/dashboard/interactive-line-chart";
import { SemanticSearch } from "@/components/search/semantic-search";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const outlineLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";
const primaryLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg brand-primary-button px-2.5 text-sm font-medium transition-colors";

type DashboardWidgetGridProps = {
  adminData?: AdminDashboardData;
  clientData?: ClientDashboardData;
  clientRecord?: {
    full_name: string;
    preferred_name: string | null;
    status: string;
  };
  customCharts?: Record<string, CustomChartData>;
  layout: DashboardWidget[];
  organizationSettings: OrganizationSettings;
  role: DashboardRole;
  staffData?: StaffDashboardData;
};

function sizeClass(size: DashboardWidget["size"]) {
  switch (size) {
    case "full":
      return "lg:col-span-12";
    case "lg":
      return "lg:col-span-6";
    case "sm":
      return "lg:col-span-3";
    case "md":
    default:
      return "lg:col-span-4";
  }
}

function MetricCard({
  helper,
  href,
  label,
  value,
}: {
  helper: string;
  href: string;
  label: string;
  value: number | string;
}) {
  return (
    <Link
      className="block rounded-2xl border p-4 shadow-sm transition-colors"
      href={href}
      style={{
        backgroundColor: "var(--brand-card)",
        borderColor: "rgb(var(--brand-border-rgb) / 0.82)",
        boxShadow: "0 8px 18px rgb(var(--brand-primary-rgb) / 0.05)",
      }}
    >
      <div className="text-sm font-medium text-stone-600">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">{value}</div>
      <p className="mt-2 text-sm text-stone-600">{helper}</p>
    </Link>
  );
}

function renderStockWidget(
  widget: DashboardWidget,
  props: DashboardWidgetGridProps,
) {
  const { adminData, clientData, clientRecord, customCharts = {}, organizationSettings, role, staffData } = props;
  const semanticSearch = getAiFeatureState("semantic_search");

  switch (widget.key) {
    case "metric_active_clients":
      return (
        <MetricCard
          helper="Open a filtered client list."
          href="/dashboard/explore?source=clients&dimension=status&value=active&metric=active_count"
          label="Active clients"
          value={role === "admin" ? adminData?.report.metrics[0]?.value ?? 0 : staffData?.activeClientsCount ?? 0}
        />
      );
    case "metric_services_week":
      return (
        <MetricCard
          helper={adminData?.report.metrics[1]?.helper ?? "This week"}
          href="/dashboard/explore?source=service_entries&dimension=week&metric=count&timeframe=this_week"
          label="Services this week"
          value={adminData?.report.metrics[1]?.value ?? 0}
        />
      );
    case "metric_services_month":
      return (
        <MetricCard
          helper={adminData?.report.metrics[2]?.helper ?? "This month"}
          href="/dashboard/explore?source=service_entries&dimension=month&metric=count&timeframe=this_month"
          label="Services this month"
          value={adminData?.report.metrics[2]?.value ?? 0}
        />
      );
    case "metric_services_quarter":
      return (
        <MetricCard
          helper={adminData?.report.metrics[3]?.helper ?? "This quarter"}
          href="/dashboard/explore?source=service_entries&dimension=month&metric=count&timeframe=this_quarter"
          label="Services this quarter"
          value={adminData?.report.metrics[3]?.value ?? 0}
        />
      );
    case "access_overview":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Access overview</CardTitle>
            <CardDescription>Review approved team and portal access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricCard helper="Admins and staff approved for this workspace." href="/admin" label="Approved team access" value={adminData?.teamAccessCount ?? 0} />
            <MetricCard helper="Client portal accounts linked to records." href="/admin" label="Approved client access" value={adminData?.portalAccessCount ?? 0} />
          </CardContent>
        </Card>
      );
    case "semantic_search":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Semantic note search</CardTitle>
            <CardDescription>
              {semanticSearch.enabled
                ? "Search internal service notes with natural language."
                : "Available as a premium search add-on for internal admin and staff teams."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SemanticSearch
              description={
                role === "admin"
                  ? "Search is limited to internal admin and staff users."
                  : "Search is available to staff and admins only."
              }
              enabled={semanticSearch.enabled}
              planLabel={semanticSearch.planLabel}
              unavailableMessage={semanticSearch.unavailableMessage}
            />
          </CardContent>
        </Card>
      );
    case "service_mix_chart":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Service mix</CardTitle>
            <CardDescription>Open a filtered detail view from each service bar.</CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveBarChart
              emptyMessage="No service activity yet."
              points={
                adminData?.report.serviceTypeBreakdown.map((item) => ({
                  href: `/dashboard/explore?source=service_entries&dimension=service_type&value=${encodeURIComponent(item.name)}&metric=count&timeframe=last_8_weeks`,
                  label: item.name,
                  value: item.count,
                })) ?? []
              }
            />
          </CardContent>
        </Card>
      );
    case "visit_trend_chart":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Visit trend</CardTitle>
            <CardDescription>Hover for detail. Click a point to inspect the underlying time bucket.</CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveLineChart
              emptyMessage="No trend data yet."
              points={
                adminData?.report.visitTrend.map((item) => ({
                  href: `/dashboard/explore?source=service_entries&dimension=week&value=${encodeURIComponent(item.key)}&metric=count&timeframe=last_8_weeks`,
                  label: item.label,
                  value: item.count,
                })) ?? []
              }
            />
          </CardContent>
        </Card>
      );
    case "exports_panel":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Exports</CardTitle>
            <CardDescription>Download reporting and backup files.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link className={outlineLinkClassName} href="/api/exports/clients">
              <Download className="size-4" />
              Clients
            </Link>
            <Link className={outlineLinkClassName} href="/api/exports/service-logs">
              <Download className="size-4" />
              Service logs
            </Link>
            <Link className={outlineLinkClassName} href="/dashboard/print">
              <Printer className="size-4" />
              Print view
            </Link>
          </CardContent>
        </Card>
      );
    case "admin_controls":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Admin controls</CardTitle>
            <CardDescription>Access setup, import, and account management tools.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link className={outlineLinkClassName} href="/admin">
              Open admin
              <ArrowRight className="size-4" />
            </Link>
            <Link className={outlineLinkClassName} href="/dashboard/customize?scope=role&targetRole=admin">
              Customize dashboard
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      );
    case "appointments_today_metric":
      return (
        <MetricCard
          helper="Open today's appointments."
          href="/dashboard/explore?source=appointments&dimension=day&metric=appointment_count&timeframe=today"
          label="Appointments today"
          value={staffData?.todayAppointments.length ?? 0}
        />
      );
    case "recent_service_logs_metric":
      return (
        <MetricCard
          helper="Open recent service activity."
          href="/dashboard/explore?source=service_entries&dimension=day&metric=count&timeframe=this_week"
          label="Recent service logs"
          value={staffData?.recentServiceCount ?? 0}
        />
      );
    case "quick_actions":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Keep high-frequency staff tasks one click away.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link className={primaryLinkClassName} href="/clients/new">
              <UserRoundPlus className="size-4" />
              Add client
            </Link>
            <Link className={outlineLinkClassName} href="/clients">
              <Users className="size-4" />
              Client directory
            </Link>
            <Link className={outlineLinkClassName} href="/schedule">
              <CalendarClock className="size-4" />
              Schedule
            </Link>
          </CardContent>
        </Card>
      );
    case "appointments_today_list":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Today&apos;s appointments</CardTitle>
            <CardDescription>Each row opens the linked client record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {staffData?.todayAppointments.length ? (
              staffData.todayAppointments.map((appointment) => (
                <Link key={appointment.id} className="block rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.42)] p-4 transition-colors hover:bg-[rgb(var(--brand-surface-rgb)/0.62)]" href={`/clients/${appointment.client_public_id}`}>
                  <p className="font-medium text-stone-950">{appointment.client_name}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    {format(new Date(appointment.scheduled_for), "h:mm a")} • {appointment.duration_minutes} min
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {appointment.location || "Location not set"} • {appointment.staff_member_name}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
                No appointments today.
              </div>
            )}
          </CardContent>
        </Card>
      );
    case "recent_clients_list":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Recent clients</CardTitle>
            <CardDescription>Open the client record from each row.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {staffData?.recentClients.length ? (
              staffData.recentClients.map((client) => (
                <Link key={client.client_id} className="block rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.42)] p-4 transition-colors hover:bg-[rgb(var(--brand-surface-rgb)/0.62)]" href={`/clients/${client.client_id}`}>
                  <p className="font-medium text-stone-950">{client.full_name}</p>
                  <p className="mt-1 text-sm text-stone-600">{client.client_id}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
                No client records yet.
              </div>
            )}
          </CardContent>
        </Card>
      );
    case "recent_service_activity_list":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Recent service activity</CardTitle>
            <CardDescription>Open the client record from each activity row.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {staffData?.recentServiceActivity.length ? (
              staffData.recentServiceActivity.map((entry, index) => (
                <Link
                  key={`${entry.client_id ?? "service"}-${entry.service_date}-${index}`}
                  className="block rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.42)] p-4 transition-colors hover:bg-[rgb(var(--brand-surface-rgb)/0.62)]"
                  href={entry.client_id ? `/clients/${entry.client_id}` : "/clients"}
                >
                  <p className="font-medium text-stone-950">
                    {entry.service_type_name} for {entry.client_name}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {entry.service_date} • {entry.staff_member_name}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
                No recent service activity yet.
              </div>
            )}
          </CardContent>
        </Card>
      );
    case "client_case_status":
      return (
        <MetricCard
          helper="Open your recent activity timeline."
          href="/dashboard/explore?source=service_entries&metric=count&timeframe=all_time"
          label="Current case status"
          value={clientRecord?.status ?? "Unknown"}
        />
      );
    case "client_upcoming_appointments":
      return (
        <MetricCard
          helper="Open your upcoming appointment list."
          href="/dashboard/explore?source=appointments&metric=appointment_count&timeframe=all_time"
          label="Upcoming appointments"
          value={clientData?.upcomingAppointments.length ?? 0}
        />
      );
    case "client_recent_activity_metric":
      return (
        <MetricCard
          helper="Open your recent service timeline."
          href="/dashboard/explore?source=service_entries&metric=count&timeframe=all_time"
          label="Recent activity"
          value={clientData?.recentActivity.length ?? 0}
        />
      );
    case "client_last_interaction":
      return (
        <MetricCard
          helper="Most recent recorded activity on your account."
          href="/dashboard/explore?source=service_entries&metric=count&timeframe=all_time"
          label="Last interaction"
          value={
            clientData?.recentActivity[0]?.service_date
              ? format(new Date(`${clientData.recentActivity[0].service_date}T00:00:00`), "MMM d, yyyy")
              : "No activity"
          }
        />
      );
    case "client_support_panel":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>{organizationSettings.support_cta_text}</CardTitle>
            <CardDescription>Open support contact details and next steps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <p>
              {organizationSettings.organization_name} is managing your case through this portal.
            </p>
            <p>{organizationSettings.support_email || organizationSettings.support_phone || "Support contact is not configured yet."}</p>
          </CardContent>
        </Card>
      );
    case "client_next_appointment":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Next appointment</CardTitle>
            <CardDescription>Open the appointment detail list.</CardDescription>
          </CardHeader>
          <CardContent>
            {clientData?.nextAppointment ? (
              <Link className="block rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.42)] p-4 transition-colors hover:bg-[rgb(var(--brand-surface-rgb)/0.62)]" href="/dashboard/explore?source=appointments&metric=appointment_count&timeframe=all_time">
                <p className="font-medium text-stone-950">
                  {format(new Date(clientData.nextAppointment.scheduled_for), "MMMM d, yyyy 'at' h:mm a")}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {clientData.nextAppointment.location || "Location details will be shared by your team."}
                </p>
                <Badge className="mt-3 capitalize" variant="outline">
                  {clientData.nextAppointment.reminder_status.replaceAll("_", " ")}
                </Badge>
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
                No upcoming appointments are scheduled.
              </div>
            )}
          </CardContent>
        </Card>
      );
    case "client_recent_activity_list":
      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Activity is shown without internal case note content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {clientData?.recentActivity.length ? (
              clientData.recentActivity.slice(0, 6).map((entry) => (
                <Link key={entry.service_entry_id} className="block rounded-2xl border border-stone-200 bg-[rgb(var(--brand-surface-rgb)/0.42)] p-4 transition-colors hover:bg-[rgb(var(--brand-surface-rgb)/0.62)]" href="/dashboard/explore?source=service_entries&metric=count&timeframe=all_time">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-stone-950">{entry.service_type_name}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {format(new Date(`${entry.service_date}T00:00:00`), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline">{entry.staff_member_name}</Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
                No activity is available yet.
              </div>
            )}
          </CardContent>
        </Card>
      );
    case "custom_chart": {
      const chart = customCharts[widget.id];

      if (!chart) {
        return (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
            Configure this chart in the dashboard editor.
          </div>
        );
      }

      return (
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>{chart.title}</CardTitle>
            <CardDescription>{chart.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {chart.chartType === "line" ? (
              <InteractiveLineChart emptyMessage="No chart data yet." points={chart.points} />
            ) : (
              <InteractiveBarChart emptyMessage="No chart data yet." points={chart.points} />
            )}
          </CardContent>
        </Card>
      );
    }
    default:
      return (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
          This widget is not available for the current role.
        </div>
      );
  }
}

export function DashboardWidgetGrid(props: DashboardWidgetGridProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {props.layout.map((widget) => (
        <section key={widget.id} className={sizeClass(widget.size)}>
          {renderStockWidget(widget, props)}
        </section>
      ))}
    </div>
  );
}
