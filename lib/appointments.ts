import {
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfToday,
  startOfWeek,
} from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

export type AppointmentWithClient = AppointmentRow & {
  client_name: string;
  client_public_id: string;
};

export async function getUpcomingAppointments(
  supabase: SupabaseClient<Database>,
) {
  const today = startOfToday();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const { data, error } = await supabase
    .from("appointments")
    .select("*, clients!appointments_client_id_fkey(full_name, client_id)")
    .gte("scheduled_for", startOfDay(today).toISOString())
    .lte("scheduled_for", endOfDay(weekEnd).toISOString())
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const appointments =
    data?.map((appointment) => ({
      ...appointment,
      client_name:
        Array.isArray(appointment.clients) && appointment.clients.length > 0
          ? appointment.clients[0]?.full_name ?? "Unknown client"
          : (appointment.clients as { full_name?: string; client_id?: string } | null)?.full_name ??
            "Unknown client",
      client_public_id:
        Array.isArray(appointment.clients) && appointment.clients.length > 0
          ? appointment.clients[0]?.client_id ?? ""
          : (appointment.clients as { full_name?: string; client_id?: string } | null)?.client_id ??
            "",
    })) ?? [];

  return {
    thisWeek: groupAppointmentsByDay(appointments, weekStart),
    today: appointments.filter((appointment) =>
      isSameDay(new Date(appointment.scheduled_for), today),
    ),
  };
}

function groupAppointmentsByDay(
  appointments: AppointmentWithClient[],
  weekStart: Date,
) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);

    return {
      appointments: appointments.filter((appointment) =>
        isSameDay(new Date(appointment.scheduled_for), day),
      ),
      date: day,
      key: format(day, "yyyy-MM-dd"),
      label: format(day, "EEEE, MMM d"),
    };
  });
}
