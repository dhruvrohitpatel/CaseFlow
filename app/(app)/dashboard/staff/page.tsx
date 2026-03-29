import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, CalendarClock, ClipboardList, UserRoundPlus, Users } from "lucide-react";

import { SemanticSearch } from "@/components/search/semantic-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getUpcomingAppointments } from "@/lib/appointments";

const primaryLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800";
const outlineLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function StaffDashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { profile, supabase } = await requireRole(["admin", "staff"]);
  const [{ today }, recentClientsResult, recentServiceResult, params, activeClientsResult] =
    await Promise.all([
      getUpcomingAppointments(supabase),
      supabase
        .from("clients")
        .select("client_id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("service_entries")
        .select("service_date, staff_member_name, clients!service_entries_client_id_fkey(client_id, full_name), service_types(name)")
        .order("service_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),
      searchParams,
      supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
    ]);

  if (recentClientsResult.error || recentServiceResult.error || activeClientsResult.error) {
    throw new Error(
      recentClientsResult.error?.message ??
        recentServiceResult.error?.message ??
        activeClientsResult.error?.message,
    );
  }

  return (
    <div className="space-y-6">
      {params.error === "unauthorized" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That action is only available to a different role.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back, {profile.full_name ?? "team member"}.</CardTitle>
            <CardDescription>
              Today’s view keeps clients, appointments, and recent activity visible without cluttering the page with admin-only controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
                <CalendarClock className="size-4" />
                Appointments today
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {today.length}
              </div>
              <p className="mt-2 text-sm text-stone-600">Stay on top of the day’s schedule.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
                <Users className="size-4" />
                Active clients
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {activeClientsResult.count ?? 0}
              </div>
              <p className="mt-2 text-sm text-stone-600">Current active caseload across the system.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
                <ClipboardList className="size-4" />
                Recent service logs
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {recentServiceResult.data?.length ?? 0}
              </div>
              <p className="mt-2 text-sm text-stone-600">Latest logged services across the team.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Keep core staff tasks one click away.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link className={primaryLinkClassName} href="/clients/new">
              <UserRoundPlus className="size-4" />
              Add client
            </Link>
            <Link className={outlineLinkClassName} href="/clients">
              Open client directory
              <ArrowRight className="size-4" />
            </Link>
            <Link className={outlineLinkClassName} href="/schedule">
              Open schedule
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle>Semantic note search</CardTitle>
          <CardDescription>
            Find prior referrals, patterns, and follow-up notes without digging through each client profile manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SemanticSearch description="This internal search is available to staff and admins only. Client portal users never see note search." />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Today’s appointments</CardTitle>
            <CardDescription>
              Same-day schedule without exposing admin reporting and export controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {today.length > 0 ? (
              today.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <Link className="font-medium text-stone-950 hover:underline" href={`/clients/${appointment.client_public_id}`}>
                    {appointment.client_name}
                  </Link>
                  <p className="mt-1 text-sm text-stone-600">
                    {format(new Date(appointment.scheduled_for), "h:mm a")} • {appointment.duration_minutes} min
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {appointment.location || "Location not set"} • {appointment.staff_member_name}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-sm text-stone-600">
                No appointments today.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader>
              <CardTitle>Recent clients</CardTitle>
              <CardDescription>Newest records first so recent intake stays easy to find.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentClientsResult.data && recentClientsResult.data.length > 0 ? (
                recentClientsResult.data.map((client) => (
                  <div key={client.client_id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <Link className="font-medium text-stone-950 hover:underline" href={`/clients/${client.client_id}`}>
                      {client.full_name}
                    </Link>
                    <p className="mt-1 text-sm text-stone-600">{client.client_id}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-600">No client records yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-stone-200 shadow-sm">
            <CardHeader>
              <CardTitle>Recent service activity</CardTitle>
              <CardDescription>Quick scan of the latest logged interactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentServiceResult.data && recentServiceResult.data.length > 0 ? (
                recentServiceResult.data.map((entry, index) => {
                  const client =
                    Array.isArray(entry.clients) && entry.clients.length > 0
                      ? entry.clients[0]
                      : entry.clients;
                  const serviceType =
                    Array.isArray(entry.service_types) && entry.service_types.length > 0
                      ? entry.service_types[0]
                      : entry.service_types;

                  return (
                    <div key={`${client?.client_id ?? "service"}-${entry.service_date}-${index}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <p className="font-medium text-stone-950">
                        {serviceType?.name ?? "Service"} for {client?.full_name ?? "Unknown client"}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {entry.service_date} • {entry.staff_member_name}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-stone-600">No recent service entries yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
