import Link from "next/link";
import { endOfMonth, endOfQuarter, endOfWeek, format, startOfMonth, startOfQuarter, startOfToday, startOfWeek } from "date-fns";

import { PageErrorState } from "@/components/ui/page-error-state";
import { getPortalClientForCurrentUser, requireAppSession } from "@/lib/auth";

type ExplorePageProps = {
  searchParams: Promise<{
    dimension?: string;
    metric?: string;
    source?: string;
    timeframe?: string;
    value?: string;
  }>;
};

function getDateRangeForTimeframe(timeframe?: string) {
  const today = startOfToday();

  switch (timeframe) {
    case "today":
      return {
        end: format(today, "yyyy-MM-dd"),
        start: format(today, "yyyy-MM-dd"),
      };
    case "this_week":
      return {
        end: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        start: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "this_month":
      return {
        end: format(endOfMonth(today), "yyyy-MM-dd"),
        start: format(startOfMonth(today), "yyyy-MM-dd"),
      };
    case "this_quarter":
      return {
        end: format(endOfQuarter(today), "yyyy-MM-dd"),
        start: format(startOfQuarter(today), "yyyy-MM-dd"),
      };
    default:
      return null;
  }
}

function getDateRangeForBucket(dimension?: string, value?: string) {
  if (!dimension || !value) {
    return null;
  }

  if (dimension === "day" || dimension === "week") {
    const baseDate = new Date(`${value}T00:00:00`);

    if (Number.isNaN(baseDate.getTime())) {
      return null;
    }

    if (dimension === "day") {
      return {
        end: format(baseDate, "yyyy-MM-dd"),
        start: format(baseDate, "yyyy-MM-dd"),
      };
    }

    return {
      end: format(endOfWeek(baseDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      start: format(startOfWeek(baseDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }

  if (dimension === "month") {
    const baseDate = new Date(`${value}-01T00:00:00`);

    if (Number.isNaN(baseDate.getTime())) {
      return null;
    }

    return {
      end: format(endOfMonth(baseDate), "yyyy-MM-dd"),
      start: format(startOfMonth(baseDate), "yyyy-MM-dd"),
    };
  }

  return null;
}

export default async function DashboardExplorePage({
  searchParams,
}: ExplorePageProps) {
  const params = await searchParams;
  const { profile, supabase } = await requireAppSession();
  const source = params.source?.trim() ?? "clients";
  const value = params.value?.trim();
  const dimension = params.dimension?.trim();
  const timeframe = params.timeframe?.trim();
  const dateRange = getDateRangeForBucket(dimension, value) ?? getDateRangeForTimeframe(timeframe);

  if (profile.role === "client" && source === "clients") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        That detail view is not available in the client portal.
      </div>
    );
  }

  if (source === "access_allowlist" && profile.role !== "admin") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        That detail view is only available to admins.
      </div>
    );
  }

  if (source === "clients") {
    let query = supabase
      .from("clients")
      .select("client_id, full_name, status, housing_status, referral_source, preferred_language, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (dimension === "status" && value) {
      query = query.eq("status", value as "active" | "inactive" | "archived");
    }

    if (dimension === "housing_status" && value) {
      query = query.eq("housing_status", value);
    }

    if (dimension === "referral_source" && value) {
      query = query.eq("referral_source", value);
    }

    if (dimension === "preferred_language" && value) {
      query = query.eq("preferred_language", value);
    }

    if (dateRange) {
      query = query
        .gte("created_at", `${dateRange.start}T00:00:00.000Z`)
        .lte("created_at", `${dateRange.end}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Explore clients</h1>
            <p className="mt-2 text-sm text-stone-600">
              Filter: {dimension && value ? `${dimension} = ${value}` : "all clients"}
            </p>
          </div>
          <PageErrorState description={error.message} title="The client detail view is unavailable." />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Explore clients</h1>
          <p className="mt-2 text-sm text-stone-600">
            Filter: {dimension && value ? `${dimension} = ${value}` : "all clients"}
          </p>
        </div>
        <div className="space-y-3">
          {data?.map((client) => (
            <Link key={client.client_id} className="block rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:bg-stone-50" href={`/clients/${client.client_id}`}>
              <p className="font-medium text-stone-950">{client.full_name}</p>
              <p className="mt-1 text-sm text-stone-600">
                {client.client_id} • {client.status} • {client.housing_status}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (source === "appointments") {
    let clientScopedId: string | null = null;

    if (profile.role === "client") {
      const { client } = await getPortalClientForCurrentUser();
      clientScopedId = client.id;
    }

    let query = supabase
      .from("appointments")
      .select("id, scheduled_for, duration_minutes, location, reminder_status, staff_member_name, clients!appointments_client_id_fkey(client_id, full_name)")
      .order("scheduled_for", { ascending: true })
      .limit(100);

    if (clientScopedId) {
      query = query.eq("client_id", clientScopedId);
    }

    if (dimension === "reminder_status" && value) {
      query = query.eq("reminder_status", value as "not_needed" | "pending" | "sent");
    }

    if (dateRange) {
      query = query
        .gte("scheduled_for", `${dateRange.start}T00:00:00.000Z`)
        .lte("scheduled_for", `${dateRange.end}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Explore appointments</h1>
            <p className="mt-2 text-sm text-stone-600">
              Filter: {dimension && value ? `${dimension} = ${value}` : "all visible appointments"}
            </p>
          </div>
          <PageErrorState description={error.message} title="The appointment detail view is unavailable." />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Explore appointments</h1>
          <p className="mt-2 text-sm text-stone-600">
            Filter: {dimension && value ? `${dimension} = ${value}` : "all visible appointments"}
          </p>
        </div>
        <div className="space-y-3">
          {data?.map((appointment) => {
            const client =
              Array.isArray(appointment.clients) && appointment.clients.length > 0
                ? appointment.clients[0]
                : appointment.clients;

            return (
              <div key={appointment.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="font-medium text-stone-950">{client?.full_name ?? "Client appointment"}</p>
                <p className="mt-1 text-sm text-stone-600">
                  {appointment.scheduled_for} • {appointment.duration_minutes} min • {appointment.staff_member_name}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {appointment.location || "Location not set"} • {appointment.reminder_status}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (source === "access_allowlist") {
    let query = supabase
      .from("access_allowlist")
      .select("email, role, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (dimension === "status" && value) {
      query = query.eq("is_active", value === "active");
    }

    if (value && dimension && dimension !== "status" && dimension !== "day" && dimension !== "week" && dimension !== "month") {
      query = query.eq("role", value as "admin" | "staff" | "client");
    }

    if (dateRange) {
      query = query
        .gte("created_at", `${dateRange.start}T00:00:00.000Z`)
        .lte("created_at", `${dateRange.end}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Explore approved access</h1>
          </div>
          <PageErrorState description={error.message} title="The approved access detail view is unavailable." />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Explore approved access</h1>
        </div>
        <div className="space-y-3">
          {data?.map((entry) => (
            <div key={`${entry.email}-${entry.role}`} className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="font-medium text-stone-950">{entry.email}</p>
              <p className="mt-1 text-sm text-stone-600">
                {entry.role} • {entry.is_active ? "active" : "inactive"}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  let clientScopedId: string | null = null;

  if (profile.role === "client") {
    const { client } = await getPortalClientForCurrentUser();
    clientScopedId = client.id;
  }

  let serviceQuery = supabase
    .from("service_entries")
    .select("id, service_date, notes, staff_member_name, clients!service_entries_client_id_fkey(client_id, full_name), service_types(name)")
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (clientScopedId) {
    serviceQuery = serviceQuery.eq("client_id", clientScopedId);
  }

  if (dimension === "service_type" && value) {
    serviceQuery = serviceQuery.eq("service_types.name", value);
  }

  if (dimension === "staff_member_name" && value) {
    serviceQuery = serviceQuery.eq("staff_member_name", value);
  }

  if (dateRange) {
    serviceQuery = serviceQuery.gte("service_date", dateRange.start).lte("service_date", dateRange.end);
  }

  const { data, error } = await serviceQuery;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Explore service activity</h1>
          <p className="mt-2 text-sm text-stone-600">
            Filter: {dimension && value ? `${dimension} = ${value}` : "all visible service activity"}
          </p>
        </div>
        <PageErrorState description={error.message} title="The service detail view is unavailable." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Explore service activity</h1>
        <p className="mt-2 text-sm text-stone-600">
          Filter: {dimension && value ? `${dimension} = ${value}` : "all visible service activity"}
        </p>
      </div>
      <div className="space-y-3">
        {data?.map((entry) => {
          const client =
            Array.isArray(entry.clients) && entry.clients.length > 0
              ? entry.clients[0]
              : entry.clients;
          const serviceType =
            Array.isArray(entry.service_types) && entry.service_types.length > 0
              ? entry.service_types[0]
              : entry.service_types;

          return (
            <div key={entry.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="font-medium text-stone-950">
                {serviceType?.name ?? "Service"} • {client?.full_name ?? "Client"}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {entry.service_date} • {entry.staff_member_name}
              </p>
              {profile.role !== "client" ? (
                <p className="mt-2 text-sm text-stone-700">{entry.notes}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
