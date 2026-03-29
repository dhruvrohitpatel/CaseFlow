import { endOfQuarter, endOfWeek, format, startOfQuarter, startOfToday, startOfWeek, subWeeks } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type ServiceTypeRow = Database["public"]["Tables"]["service_types"]["Row"];

export type DashboardMetric = {
  label: string;
  value: number;
  helper: string;
};

export type DashboardReport = {
  metrics: DashboardMetric[];
  serviceTypeBreakdown: Array<{ name: string; count: number }>;
  visitTrend: Array<{ key: string; label: string; count: number }>;
  generatedAt: string;
};

function toDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function quarterLabel(date: Date) {
  return `${format(date, "MMM d")} to ${format(endOfQuarter(date), "MMM d")}`;
}

export async function getDashboardReport(supabase: SupabaseClient<Database>) {
  const today = startOfToday();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfThisQuarter = startOfQuarter(today);
  const endOfThisQuarter = endOfQuarter(today);

  const [
    { count: activeClients },
    { count: servicesThisWeek },
    { count: servicesThisMonth },
    { count: servicesThisQuarter },
    { data: serviceEntries, error: serviceEntriesError },
    { data: serviceTypes, error: serviceTypesError },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("service_entries")
      .select("*", { count: "exact", head: true })
      .gte("service_date", toDateString(startOfThisWeek))
      .lte("service_date", toDateString(endOfThisWeek)),
    supabase
      .from("service_entries")
      .select("*", { count: "exact", head: true })
      .gte("service_date", toDateString(startOfThisMonth)),
    supabase
      .from("service_entries")
      .select("*", { count: "exact", head: true })
      .gte("service_date", toDateString(startOfThisQuarter))
      .lte("service_date", toDateString(endOfThisQuarter)),
    supabase
      .from("service_entries")
      .select("service_type_id, service_date")
      .gte("service_date", toDateString(subWeeks(today, 7)))
      .order("service_date", { ascending: true }),
    supabase
      .from("service_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (serviceEntriesError || serviceTypesError) {
    throw new Error(serviceEntriesError?.message ?? serviceTypesError?.message);
  }

  return {
    generatedAt: new Date().toISOString(),
    metrics: [
      {
        helper: "Based on the explicit client status field.",
        label: "Total active clients",
        value: activeClients ?? 0,
      },
      {
        helper: `${format(startOfThisWeek, "MMM d")} to ${format(endOfThisWeek, "MMM d")}`,
        label: "Services this week",
        value: servicesThisWeek ?? 0,
      },
      {
        helper: format(startOfThisMonth, "MMMM yyyy"),
        label: "Services this month",
        value: servicesThisMonth ?? 0,
      },
      {
        helper: quarterLabel(today),
        label: "Services this quarter",
        value: servicesThisQuarter ?? 0,
      },
    ],
    serviceTypeBreakdown: buildServiceTypeBreakdown(serviceTypes ?? [], serviceEntries ?? []),
    visitTrend: buildVisitTrend(serviceEntries ?? []),
  } satisfies DashboardReport;
}

function buildServiceTypeBreakdown(
  serviceTypes: ServiceTypeRow[],
  entries: Array<{ service_type_id: string; service_date: string }>,
) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    counts.set(entry.service_type_id, (counts.get(entry.service_type_id) ?? 0) + 1);
  }

  return serviceTypes
    .map((type) => ({
      count: counts.get(type.id) ?? 0,
      name: type.name,
    }))
    .filter((item) => item.count > 0);
}

function buildVisitTrend(entries: Array<{ service_date: string }>) {
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const weekStart = startOfWeek(subWeeks(startOfToday(), 7 - index), {
      weekStartsOn: 1,
    });

    return {
      count: 0,
      key: toDateString(weekStart),
      label: format(weekStart, "MMM d"),
      weekStart,
    };
  });

  const byKey = new Map(weeks.map((week) => [week.key, week]));

  for (const entry of entries) {
    const bucketKey = toDateString(
      startOfWeek(new Date(`${entry.service_date}T00:00:00`), { weekStartsOn: 1 }),
    );
    const bucket = byKey.get(bucketKey);

    if (bucket) {
      bucket.count += 1;
    }
  }

  return weeks.map(({ count, key, label }) => ({
    count,
    key,
    label,
  }));
}
