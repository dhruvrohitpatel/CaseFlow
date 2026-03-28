"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/actions/form-state";
import { getStaffDisplayName, requireRole } from "@/lib/auth";
import { createAppointmentSchema } from "@/lib/validators/appointment";

function getFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  return error.flatten().fieldErrors;
}

export async function createAppointmentAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createAppointmentSchema.safeParse({
    clientId: formData.get("clientId"),
    durationMinutes: formData.get("durationMinutes"),
    location: formData.get("location"),
    notes: formData.get("notes"),
    reminderStatus: formData.get("reminderStatus"),
    scheduledFor: formData.get("scheduledFor"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
      message: "Fix the highlighted appointment fields and try again.",
      status: "error",
    };
  }

  const { profile, supabase, user } = await requireRole(["admin", "staff"]);
  const { error } = await supabase.from("appointments").insert({
    client_id: parsed.data.clientId,
    duration_minutes: parsed.data.durationMinutes,
    location: parsed.data.location,
    notes: parsed.data.notes,
    reminder_status: parsed.data.reminderStatus,
    scheduled_for: parsed.data.scheduledFor,
    staff_member_name: getStaffDisplayName(profile, user.email),
    staff_member_profile_id: profile.id,
  });

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  revalidatePath("/schedule");
  revalidatePath("/dashboard");

  return {
    message: "Appointment created.",
    status: "success",
  };
}

export async function deleteAppointmentAction(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");

  if (!appointmentId) {
    redirect("/schedule?error=delete");
  }

  const { supabase } = await requireRole(["admin", "staff"]);
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);

  if (error) {
    redirect("/schedule?error=delete");
  }

  revalidatePath("/schedule");
  redirect("/schedule?deleted=1");
}
