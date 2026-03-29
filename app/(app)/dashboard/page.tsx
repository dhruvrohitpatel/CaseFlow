import Link from "next/link";
import { ArrowRight, CalendarClock, Download, Printer } from "lucide-react";

import { ServiceTypeBarChart } from "@/components/dashboard/service-type-bar-chart";
import { VisitTrendChart } from "@/components/dashboard/visit-trend-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SemanticSearch } from "@/components/search/semantic-search";
import { requireCurrentSession } from "@/lib/auth";
import { getDashboardReport } from "@/lib/reporting";

const primaryLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800";
const outlineLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { profile, supabase } = await requireCurrentSession();
  const [report, params] = await Promise.all([
    getDashboardReport(supabase),
    searchParams,
  ]);

  return (
    <div className="space-y-6">
      {params.error === "unauthorized" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That action is only available to admin users.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              Mission control for {profile.full_name ?? "your team"}.
            </CardTitle>
            <CardDescription>
              P1 adds reporting, exports, scheduling, configurable fields, and audit visibility while preserving the P0 client and service workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {report.metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-sm font-medium text-stone-600">{metric.label}</div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                  {metric.value}
                </div>
                <p className="mt-2 text-sm text-stone-600">{metric.helper}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Exports and print</CardTitle>
            <CardDescription>
              Keep data portable for admin review, board meetings, and backup workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Link className={outlineLinkClassName} href="/api/exports/clients">
                <Download className="size-4" />
                Clients CSV
              </Link>
              <Link className={outlineLinkClassName} href="/api/exports/service-logs">
                <Download className="size-4" />
                Service logs CSV
              </Link>
            </div>
            <Link className={primaryLinkClassName} href="/dashboard/print">
              <Printer className="size-4" />
              Print-friendly report
            </Link>
            <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
              This page is designed to stay readable on its own. The print view strips navigation and keeps only the report content.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Service mix</CardTitle>
            <CardDescription>
              Quick bar view of which services are showing up most often in recent reporting data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceTypeBarChart items={report.serviceTypeBreakdown} />
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Visit trend</CardTitle>
            <CardDescription>
              Eight-week trend to spot whether activity is climbing, steady, or slipping.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VisitTrendChart points={report.visitTrend} />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Search case notes</CardTitle>
            <CardDescription>
              Ask in plain language — find clients by what was done, not just by name.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SemanticSearch />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Client intake</CardTitle>
            <CardDescription>
              Intake still follows the existing P0 workflow, now with optional admin-managed custom fields.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={primaryLinkClassName} href="/clients/new">
              Open intake form
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming schedule</CardTitle>
            <CardDescription>
              Keep today and this week visible without introducing a heavy calendar system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={outlineLinkClassName} href="/schedule">
              <CalendarClock className="size-4" />
              Open schedule
            </Link>
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Admin tools</CardTitle>
            <CardDescription>
              CSV import, configurable fields, and audit logs live together in one steady workflow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.role === "admin" ? (
              <Link className={outlineLinkClassName} href="/admin">
                Open admin tools
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <p className="text-sm text-stone-600">
                Admin-only tools remain hidden for staff to keep the workflow focused.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}