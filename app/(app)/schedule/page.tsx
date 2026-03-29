import { format } from "date-fns";
import Link from "next/link";

import { deleteAppointmentAction } from "@/app/actions/appointments";
import { CreateAppointmentForm } from "@/components/forms/create-appointment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageErrorState } from "@/components/ui/page-error-state";
import { requireRole } from "@/lib/auth";
import { getUpcomingAppointments } from "@/lib/appointments";

type SchedulePageProps = {
  searchParams: Promise<{
    deleted?: string;
    error?: string;
  }>;
};

export default async function SchedulePage({
  searchParams,
}: SchedulePageProps) {
  const { supabase } = await requireRole(["admin", "staff"]);
  const [appointmentsResult, { data: clients, error: clientsError }, params] =
    await Promise.all([
      getUpcomingAppointments(supabase)
        .then((data) => ({ data, error: null }))
        .catch((error: unknown) => ({
          data: { thisWeek: [], today: [] },
          error: error instanceof Error ? error.message : "Schedule data could not be loaded.",
        })),
      supabase
        .from("clients")
        .select("id, client_id, full_name")
        .neq("status", "archived")
        .order("full_name", { ascending: true }),
      searchParams,
    ]);
  const today = appointmentsResult.data.today;
  const thisWeek = appointmentsResult.data.thisWeek;
  const pageError = appointmentsResult.error ?? clientsError?.message ?? null;

  return (
    <div className="space-y-6">
      {params.deleted === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Appointment removed.
        </div>
      ) : null}
      {params.error === "delete" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We could not delete that appointment. Try again.
        </div>
      ) : null}
      {pageError ? (
        <PageErrorState description={pageError} title="Part of the schedule is unavailable." />
      ) : null}

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Schedule</h1>
        <p className="mt-2 text-sm text-stone-600">
          Track upcoming appointments, reminder status, and the next week of visits.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <CreateAppointmentForm
          clients={
            (clients ?? []).map((client) => ({
              id: client.id,
              label: `${client.full_name} (${client.client_id})`,
            }))
          }
        />

        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Today</CardTitle>
            <CardDescription>
              Same-day appointments stay visible first so staff can prep quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {today.length > 0 ? (
              today.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <Link className="text-base font-semibold text-stone-950 hover:underline" href={`/clients/${appointment.client_public_id}`}>
                        {appointment.client_name}
                      </Link>
                      <p className="mt-1 text-sm text-stone-600">
                        {format(new Date(appointment.scheduled_for), "h:mm a")} for {appointment.duration_minutes} minutes
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {appointment.location || "Location not set"} with {appointment.staff_member_name}
                      </p>
                    </div>
                    <Badge className="capitalize" variant="outline">
                      {appointment.reminder_status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  {appointment.notes ? (
                    <p className="mt-3 text-sm leading-6 text-stone-700">{appointment.notes}</p>
                  ) : null}
                  <form action={deleteAppointmentAction} className="mt-4">
                    <input name="appointmentId" type="hidden" value={appointment.id} />
                    <Button type="submit" variant="ghost">
                      Remove appointment
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center text-sm text-stone-600">
                No appointments today.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle>This week</CardTitle>
          <CardDescription>
            Lightweight day-grouped layout for the next seven days. No drag-and-drop, just reliable visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {thisWeek.map((day) => (
            <div key={day.key} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-stone-950">{day.label}</h2>
                <Badge variant="secondary">{day.appointments.length}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {day.appointments.length > 0 ? (
                  day.appointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-xl bg-stone-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link className="font-medium text-stone-900 hover:underline" href={`/clients/${appointment.client_public_id}`}>
                            {appointment.client_name}
                          </Link>
                          <p className="mt-1 text-sm text-stone-600">
                            {format(new Date(appointment.scheduled_for), "h:mm a")} • {appointment.duration_minutes} min
                          </p>
                          <p className="mt-1 text-sm text-stone-600">
                            {appointment.location || "Location not set"}
                          </p>
                        </div>
                        <Badge className="capitalize" variant="outline">
                          {appointment.reminder_status.replaceAll("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-500">No appointments scheduled.</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
