"use server";

import { redirect } from "next/navigation";

import { type ActionState } from "@/lib/actions/form-state";
import { getStaffDisplayName, requireRole } from "@/lib/auth";
import { createServiceEntrySchema } from "@/lib/validators/service-entry";

function getFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  return error.flatten().fieldErrors;
}

export async function createServiceEntryAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createServiceEntrySchema.safeParse({
    clientPublicId: formData.get("clientPublicId"),
    notes: formData.get("notes"),
    serviceDate: formData.get("serviceDate"),
    serviceTypeId: formData.get("serviceTypeId"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
      message: "Fix the highlighted fields and try again.",
      status: "error",
    };
  }

  const { profile, supabase, user } = await requireRole(["admin", "staff"]);
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, client_id")
    .eq("client_id", parsed.data.clientPublicId)
    .single();

  if (clientError || !client) {
    return {
      message: "We could not find that client record.",
      status: "error",
    };
  }

  const { error } = await supabase.from("service_entries").insert({
    client_id: client.id,
    notes: parsed.data.notes,
    service_date: parsed.data.serviceDate,
    service_type_id: parsed.data.serviceTypeId,
    staff_member_name: getStaffDisplayName(profile, user.email),
    staff_member_profile_id: profile.id,
  });

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  redirect(`/clients/${client.client_id}?logged=1`);
}
