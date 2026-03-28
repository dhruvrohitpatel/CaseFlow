"use server";

import { redirect } from "next/navigation";

import { type ActionState } from "@/lib/actions/form-state";
import { requireRole } from "@/lib/auth";
import { createClientSchema } from "@/lib/validators/client";

function getFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  return error.flatten().fieldErrors;
}

export async function createClientAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createClientSchema.safeParse({
    dateOfBirth: formData.get("dateOfBirth"),
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    housingStatus: formData.get("housingStatus"),
    phone: formData.get("phone"),
    preferredLanguage: formData.get("preferredLanguage"),
    preferredName: formData.get("preferredName"),
    pronouns: formData.get("pronouns"),
    referralSource: formData.get("referralSource"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
      message: "Fix the highlighted fields and try again.",
      status: "error",
    };
  }

  const { profile, supabase } = await requireRole(["admin", "staff"]);
  const { data, error } = await supabase
    .from("clients")
    .insert({
      created_by: profile.id,
      date_of_birth: parsed.data.dateOfBirth,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      housing_status: parsed.data.housingStatus,
      phone: parsed.data.phone,
      preferred_language: parsed.data.preferredLanguage,
      preferred_name: parsed.data.preferredName,
      pronouns: parsed.data.pronouns,
      referral_source: parsed.data.referralSource,
    })
    .select("client_id")
    .single();

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  redirect(`/clients/${data.client_id}?created=1`);
}
