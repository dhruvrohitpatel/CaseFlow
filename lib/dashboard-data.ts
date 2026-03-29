import { endOfDay, endOfMonth, endOfQuarter, endOfToday, endOfWeek, format, startOfMonth, startOfQuarter, startOfToday, startOfWeek, subWeeks } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type { DashboardRole, DashboardWidget } from "@/lib/dashboard-layouts";
import { getDashboardReport } from "@/lib/reporting";

type DbClient = SupabaseClient<Database>;

export type AdminDashboardData = {
  portalAccessCount: number;
  report: Awaited<ReturnType<typeof getDashboardReport>>;
  teamAccessCount: number;
};

export type StaffDashboardData = {
  activeClientsCount: number;
  recentClients: Array<{ client_id: string; full_name: string }>;
  recentServiceActivity: Array<{
    client_id: string | null;
    client_name: string;
    service_date: string;
    service_type_name: string;
    staff_member_name: string;
  }>;
  recentServiceCount: number;
  todayAppointments: Array<{
    client_name: string;
    client_public_id: string;
    duration_minutes: number;
    id: string;
    location: string | null;
    scheduled_for: string;
    staff_member_name: string;
  }>;
};

export type ClientDashboardData = {
  nextAppointment: {
    id: string;
    location: string | null;
    reminder_status: Database["public"]["Enums"]["reminder_status"];
    scheduled_for: string;
    staff_member_name: string;
  } | null;
  recentActivity: Array<{
    service_date: string;
    service_entry_id: string;
    service_type_name: string;
    staff_member_name: string;
  }>;
  upcomingAppointments: Array<{
    id: string;
    location: string | null;
    reminder_status: Database["public"]["Enums"]["reminder_status"];
    scheduled_for: string;
    staff_member_name: string;
  }>;
};

export type ChartPoint = {
  href: string;
  label: string;
  value: number;
};

export type CustomChartData = {
  chartType: "bar" | "line" | "table";
  description: string;
  points: ChartPoint[];
  title: string;
};

function dateRangeForTimeframe(timeframe: string) {
  const today = startOfToday();

  switch (timeframe) {
    case "today":
      return {
        end: endOfToday(),
        start: startOfToday(),
      };
    case "this_week":
      return {
        end: endOfWeek(today, { weekStartsOn: 1 }),
        start: startOfWeek(today, { weekStartsOn: 1 }),
      };
    case "this_month":
      return {
        end: endOfMonth(today),
        start: startOfMonth(today),
      };
    case "this_quarter":
      return {
        end: endOfQuarter(today),
        start: startOfQuarter(today),
      };
    case "last_8_weeks":
      return {
        end: endOfDay(today),
        start: startOfWeek(subWeeks(today, 7), { weekStartsOn: 1 }),
      };
    default:
      return null;
  }
}

function toDateKey(date: Date, dimension: string) {
  if (dimension === "month") {
    return format(date, "yyyy-MM");
  }

  if (dimension === "week") {
    return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
  }

  return format(date, "yyyy-MM-dd");
}

function toDateLabel(key: string, dimension: string) {
  if (dimension === "month") {
    return format(new Date(`${key}-01T00:00:00`), "MMM yyyy");
  }

  return format(new Date(`${key}T00:00:00`), dimension === "week" ? "MMM d" : "MMM d");
}

export function buildExploreHref(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const query = search.toString();

  return query ? `/dashboard/explore?${query}` : "/dashboard/explore";
}

export async function getAdminDashboardData(supabase: DbClient): Promise<AdminDashboardData> {
  const [report, { count: teamAccessCount }, { count: portalAccessCount }] =
    await Promise.all([
      getDashboardReport(supabase),
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

  return {
    portalAccessCount: portalAccessCount ?? 0,
    report,
    teamAccessCount: teamAccessCount ?? 0,
  };
}

export async function getStaffDashboardData(supabase: DbClient): Promise<StaffDashboardData> {
  const todayStart = startOfToday().toISOString();
  const tomorrow = endOfToday().toISOString();

  const [
    todayAppointmentsResult,
    recentClientsResult,
    recentServiceResult,
    activeClientsResult,
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, duration_minutes, location, scheduled_for, staff_member_name, clients!appointments_client_id_fkey(client_id, full_name)")
      .gte("scheduled_for", todayStart)
      .lte("scheduled_for", tomorrow)
      .order("scheduled_for", { ascending: true }),
    supabase
      .from("clients")
      .select("client_id, full_name")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("service_entries")
      .select("service_date, staff_member_name, clients!service_entries_client_id_fkey(client_id, full_name), service_types(name)")
      .order("service_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  if (
    todayAppointmentsResult.error ||
    recentClientsResult.error ||
    recentServiceResult.error ||
    activeClientsResult.error
  ) {
    throw new Error(
      todayAppointmentsResult.error?.message ??
        recentClientsResult.error?.message ??
        recentServiceResult.error?.message ??
        activeClientsResult.error?.message,
    );
  }

  return {
    activeClientsCount: activeClientsResult.count ?? 0,
    recentClients:
      recentClientsResult.data?.map((client) => ({
        client_id: client.client_id,
        full_name: client.full_name,
      })) ?? [],
    recentServiceActivity:
      recentServiceResult.data?.map((entry) => {
        const client =
          Array.isArray(entry.clients) && entry.clients.length > 0
            ? entry.clients[0]
            : entry.clients;
        const serviceType =
          Array.isArray(entry.service_types) && entry.service_types.length > 0
            ? entry.service_types[0]
            : entry.service_types;

        return {
          client_id: client?.client_id ?? null,
          client_name: client?.full_name ?? "Unknown client",
          service_date: entry.service_date,
          service_type_name: serviceType?.name ?? "Service",
          staff_member_name: entry.staff_member_name,
        };
      }) ?? [],
    recentServiceCount: recentServiceResult.data?.length ?? 0,
    todayAppointments:
      todayAppointmentsResult.data?.map((appointment) => {
        const client =
          Array.isArray(appointment.clients) && appointment.clients.length > 0
            ? appointment.clients[0]
            : appointment.clients;

        return {
          client_name: client?.full_name ?? "Unknown client",
          client_public_id: client?.client_id ?? "",
          duration_minutes: appointment.duration_minutes,
          id: appointment.id,
          location: appointment.location,
          scheduled_for: appointment.scheduled_for,
          staff_member_name: appointment.staff_member_name,
        };
      }) ?? [],
  };
}

export async function getClientDashboardData(
  supabase: DbClient,
  clientId: string,
): Promise<ClientDashboardData> {
  const [{ data: upcomingAppointments, error: appointmentError }, { data: serviceActivity, error: serviceActivityError }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id, scheduled_for, location, reminder_status, staff_member_name")
        .eq("client_id", clientId)
        .gte("scheduled_for", new Date().toISOString())
        .order("scheduled_for", { ascending: true })
        .limit(5),
      supabase.rpc("get_client_service_activity"),
    ]);

  if (appointmentError || serviceActivityError) {
    throw new Error(appointmentError?.message ?? serviceActivityError?.message);
  }

  return {
    nextAppointment: upcomingAppointments?.[0] ?? null,
    recentActivity: serviceActivity ?? [],
    upcomingAppointments: upcomingAppointments ?? [],
  };
}

function filterWithinRange<T extends { date: Date }>(
  rows: T[],
  timeframe: string | undefined,
) {
  if (!timeframe || timeframe === "all_time") {
    return rows;
  }

  const range = dateRangeForTimeframe(timeframe);

  if (!range) {
    return rows;
  }

  return rows.filter((row) => row.date >= range.start && row.date <= range.end);
}

export async function getCustomChartData(
  supabase: DbClient,
  widget: DashboardWidget,
  role: DashboardRole,
  options?: { clientId?: string },
): Promise<CustomChartData> {
  const config = widget.config ?? {};
  const dataSource = config.dataSource ?? "clients";
  const metric = config.metric ?? "count";
  const dimension = config.dimension ?? "status";
  const timeframe = config.timeframe ?? "this_month";
  const chartType = config.chartType ?? "bar";
  const title = config.title?.trim() || "Custom chart";

  if (dataSource === "clients") {
    const query = supabase
      .from("clients")
      .select("client_id, status, housing_status, referral_source, preferred_language, created_at");

    if (role === "client" && options?.clientId) {
      query.eq("id", options.clientId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterWithinRange(
      (data ?? []).map((row) => ({ ...row, date: new Date(row.created_at) })),
      timeframe,
    );
    const bucket = new Map<string, number>();

    rows.forEach((row) => {
      const key =
        dimension === "status"
          ? row.status
          : dimension === "housing_status"
            ? row.housing_status
            : dimension === "preferred_language"
              ? row.preferred_language
              : dimension === "referral_source"
                ? row.referral_source
                : toDateKey(row.date, dimension);
      const nextValue =
        metric === "unique_clients" ? 1 : 1;
      bucket.set(key, (bucket.get(key) ?? 0) + nextValue);
    });

    const points = Array.from(bucket.entries()).map(([label, value]) => ({
      href: buildExploreHref({
        dimension,
        metric,
        source: dataSource,
        timeframe,
        value: label,
      }),
      label: dimension === "week" || dimension === "month" || dimension === "day" ? toDateLabel(label, dimension) : label,
      value,
    }));

    return {
      chartType,
      description: `${points.length} grouped result${points.length === 1 ? "" : "s"} from client records.`,
      points,
      title,
    };
  }

  if (dataSource === "appointments") {
    const query = supabase
      .from("appointments")
      .select("client_id, scheduled_for, reminder_status, staff_member_name");

    if (role === "client" && options?.clientId) {
      query.eq("client_id", options.clientId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterWithinRange(
      (data ?? []).map((row) => ({ ...row, date: new Date(row.scheduled_for) })),
      timeframe,
    );
    const bucket = new Map<string, number>();

    rows.forEach((row) => {
      const key =
        dimension === "reminder_status"
          ? row.reminder_status
          : dimension === "staff_member_name"
            ? row.staff_member_name
            : toDateKey(row.date, dimension);
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    });

    const points = Array.from(bucket.entries()).map(([label, value]) => ({
      href: buildExploreHref({
        dimension,
        metric,
        source: dataSource,
        timeframe,
        value: label,
      }),
      label: dimension === "week" || dimension === "month" || dimension === "day" ? toDateLabel(label, dimension) : label,
      value,
    }));

    return {
      chartType,
      description: `${points.length} appointment group${points.length === 1 ? "" : "s"} in the selected timeframe.`,
      points,
      title,
    };
  }

  if (dataSource === "access_allowlist") {
    const { data, error } = await supabase
      .from("access_allowlist")
      .select("created_at, is_active, role");

    if (error) {
      throw new Error(error.message);
    }

    const rows = filterWithinRange(
      (data ?? []).map((row) => ({
        ...row,
        date: new Date(row.created_at),
      })),
      timeframe,
    );
    const bucket = new Map<string, number>();

    rows.forEach((row) => {
      const key =
        dimension === "status"
          ? row.is_active
            ? "active"
            : "inactive"
          : dimension === "day" || dimension === "week" || dimension === "month"
            ? toDateKey(row.date, dimension)
            : row.role;
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    });

    const points = Array.from(bucket.entries()).map(([label, value]) => ({
      href: buildExploreHref({
        dimension,
        metric,
        source: dataSource,
        timeframe,
        value: label,
      }),
      label:
        dimension === "week" || dimension === "month" || dimension === "day"
          ? toDateLabel(label, dimension)
          : label,
      value,
    }));

    return {
      chartType,
      description: `${points.length} access group${points.length === 1 ? "" : "s"} from approved email access.`,
      points,
      title,
    };
  }

  const query = supabase
    .from("service_entries")
    .select("client_id, service_date, staff_member_name, service_types(name)");

  if (role === "client" && options?.clientId) {
    query.eq("client_id", options.clientId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = filterWithinRange(
    (data ?? []).map((row) => ({
      ...row,
      date: new Date(`${row.service_date}T00:00:00`),
      service_type_name:
        Array.isArray(row.service_types) && row.service_types.length > 0
          ? row.service_types[0]?.name ?? "Service"
          : row.service_types?.name ?? "Service",
    })),
    timeframe,
  );
  const bucket = new Map<string, number>();
  const uniqueness = new Map<string, Set<string>>();

  rows.forEach((row) => {
    const key =
      dimension === "service_type"
        ? row.service_type_name
        : dimension === "staff_member_name"
          ? row.staff_member_name
          : toDateKey(row.date, dimension);

    if (metric === "unique_clients") {
      const current = uniqueness.get(key) ?? new Set<string>();
      current.add(row.client_id);
      uniqueness.set(key, current);
      bucket.set(key, current.size);
      return;
    }

    bucket.set(key, (bucket.get(key) ?? 0) + 1);
  });

  const points = Array.from(bucket.entries()).map(([label, value]) => ({
    href: buildExploreHref({
      dimension,
      metric,
      source: dataSource,
      timeframe,
      value: label,
    }),
    label: dimension === "week" || dimension === "month" || dimension === "day" ? toDateLabel(label, dimension) : label,
    value,
  }));

  return {
    chartType,
    description: `${points.length} result${points.length === 1 ? "" : "s"} from service activity.`,
    points,
    title,
  };
}
