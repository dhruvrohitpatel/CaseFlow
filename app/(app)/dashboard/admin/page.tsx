import Link from "next/link";
import { ArrowRight, Download, Printer, ShieldCheck, UsersRound } from "lucide-react";

import { ServiceTypeBarChart } from "@/components/dashboard/service-type-bar-chart";
import { VisitTrendChart } from "@/components/dashboard/visit-trend-chart";
import { SemanticSearch } from "@/components/search/semantic-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
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

export default async function AdminDashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { profile, supabase } = await requireRole(["admin"]);
  const [report, params, { count: teamAccessCount }, { count: portalCount }] = await Promise.all([
    getDashboardReport(supabase),
    searchParams,
    supabase
      .from("access_allowlist")
      .select("*", { count: "exact", head: true })
      .in("role", ["admin", "staff"])
      .eq("is_active", true),
    supabase
      .from("access_allowlist")
      .select("*", { count: "exact", head: true })
      .eq("role", "client")
      .eq("is_active", true),
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
              Reporting, access oversight, and operational visibility for the people running the program.
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
            <CardTitle>Access overview</CardTitle>
            <CardDescription>
              Keep onboarding and portal access deliberate instead of leaving accounts open to public signup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
                <UsersRound className="size-4" />
                Approved team access
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {teamAccessCount ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
                <ShieldCheck className="size-4" />
                Approved client access
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {portalCount ?? 0}
              </div>
            </div>
            <Link className={outlineLinkClassName} href="/admin">
              Open admin tools
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-stone-200 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Semantic note search</CardTitle>
            <CardDescription>
              Search across service notes with natural language to find referrals, themes, and past follow-up details quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SemanticSearch description="Search is limited to internal admin and staff users. Results pull from service-note history only." />
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Service mix</CardTitle>
            <CardDescription>
              Which services are driving the current workload.
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
              Eight-week trend to spot growth, slowdown, or unusual dips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VisitTrendChart points={report.visitTrend} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Exports</CardTitle>
            <CardDescription>Admin-only data export for reporting and backup workflows.</CardDescription>
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
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Printable report</CardTitle>
            <CardDescription>Clean browser-print version of the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={primaryLinkClassName} href="/dashboard/print">
              <Printer className="size-4" />
              Print view
            </Link>
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Access management</CardTitle>
            <CardDescription>Approve emails, assign roles, and link client portals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={outlineLinkClassName} href="/admin">
              Manage accounts
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Audit and config</CardTitle>
            <CardDescription>Review audit history and field configuration in one place.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={outlineLinkClassName} href="/admin">
              Open controls
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
