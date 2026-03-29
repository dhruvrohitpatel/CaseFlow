import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPortalClientForCurrentUser } from "@/lib/auth";

export default async function ClientDashboardPage() {
  const { client, supabase } = await getPortalClientForCurrentUser();
  const [
    { data: organizationSettings, error: settingsError },
    { data: upcomingAppointments, error: appointmentError },
    { data: serviceActivity, error: serviceActivityError },
  ] = await Promise.all([
    supabase
      .from("organization_settings")
      .select("organization_name")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, scheduled_for, location, reminder_status, staff_member_name")
      .eq("client_id", client.id)
      .gte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(5),
    supabase.rpc("get_client_service_activity"),
  ]);

  if (settingsError || appointmentError || serviceActivityError) {
    throw new Error(
      settingsError?.message ??
        appointmentError?.message ??
        serviceActivityError?.message,
    );
  }

  const nextAppointment = upcomingAppointments?.[0] ?? null;
  const recentActivity = serviceActivity ?? [];
  const lastInteraction = recentActivity[0]?.service_date ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome, {client.preferred_name ?? client.full_name}.
            </CardTitle>
            <CardDescription>
              This portal gives you a safe read-only view of your status, upcoming appointments, and recent support activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-sm font-medium text-stone-600">Current case status</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight capitalize text-stone-950">
                {client.status}
              </div>
              <p className="mt-2 text-sm text-stone-600">This reflects the latest status your team has set.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-sm font-medium text-stone-600">Upcoming appointments</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {upcomingAppointments?.length ?? 0}
              </div>
              <p className="mt-2 text-sm text-stone-600">Your next five appointments are visible here.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-sm font-medium text-stone-600">Recent service activity</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {recentActivity.length}
              </div>
              <p className="mt-2 text-sm text-stone-600">Recent support interactions shown without internal case notes.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-sm font-medium text-stone-600">Last interaction</div>
              <div className="mt-3 text-xl font-semibold tracking-tight text-stone-950">
                {lastInteraction ? format(new Date(`${lastInteraction}T00:00:00`), "MMMM d, yyyy") : "No activity yet"}
              </div>
              <p className="mt-2 text-sm text-stone-600">Based on the latest recorded service activity on your account.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Need help?</CardTitle>
            <CardDescription>
              Keep contact information simple and easy to find.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-stone-600">
            <p>
              <strong className="text-stone-950">{organizationSettings?.organization_name ?? "Your support organization"}</strong>
              {" "}is managing your case through CaseFlow.
            </p>
            <p>
              Reach out to your assigned staff member or the organization directly if your appointment details look wrong or your situation changes.
            </p>
            {nextAppointment ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-950">Next appointment</p>
                <p className="mt-2 text-sm text-stone-600">
                  {format(new Date(nextAppointment.scheduled_for), "MMMM d, yyyy 'at' h:mm a")}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {nextAppointment.location || "Location details will be shared by your team."}
                </p>
                <Badge className="mt-3 capitalize" variant="outline">
                  {nextAppointment.reminder_status.replaceAll("_", " ")}
                </Badge>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
                No upcoming appointments are scheduled right now.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            A simplified timeline of recent support activity. Internal note details are intentionally not shown here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 6).map((entry) => (
              <div key={entry.service_entry_id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-stone-950">{entry.service_type_name}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {format(new Date(`${entry.service_date}T00:00:00`), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="secondary">{entry.staff_member_name}</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-sm text-stone-600">
              No service activity is available yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
