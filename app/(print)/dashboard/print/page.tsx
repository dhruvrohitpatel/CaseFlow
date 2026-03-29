import { format } from "date-fns";

import { ServiceTypeBarChart } from "@/components/dashboard/service-type-bar-chart";
import { VisitTrendChart } from "@/components/dashboard/visit-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getDashboardReport } from "@/lib/reporting";

export default async function DashboardPrintPage() {
  const { supabase } = await requireRole(["admin"]);
  const report = await getDashboardReport(supabase);

  return (
    <div className="space-y-6 print:p-0">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-stone-500">CaseFlow report</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          Printable dashboard snapshot
        </h1>
        <p className="text-sm text-stone-600">
          Generated {format(new Date(report.generatedAt), "MMMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {report.metrics.map((metric) => (
          <Card key={metric.label} className="border-stone-200 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-stone-950">{metric.value}</div>
              <p className="mt-2 text-sm text-stone-600">{metric.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-stone-200 shadow-none">
          <CardHeader>
            <CardTitle>Service mix</CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceTypeBarChart items={report.serviceTypeBreakdown} />
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-none">
          <CardHeader>
            <CardTitle>Visit trend</CardTitle>
          </CardHeader>
          <CardContent>
            <VisitTrendChart points={report.visitTrend} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
