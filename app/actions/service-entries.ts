"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { type ActionState } from "@/lib/actions/form-state";
import { isSemanticSearchEnabled } from "@/lib/ai/capabilities";
import { generateEmbedding, serializeVector } from "@/lib/ai/embeddings";
import { getStaffDisplayName, requireRole } from "@/lib/auth";
import {
  getActiveCustomFieldDefinitions,
  parseCustomFieldFormValues,
  replaceServiceEntryCustomFieldValues,
} from "@/lib/custom-fields";
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
  const definitions = await getActiveCustomFieldDefinitions(supabase, "service_entry");
  const customFields = parseCustomFieldFormValues(definitions, formData);
  let embedding: string | null = null;

  if (isSemanticSearchEnabled()) {
    try {
      embedding = serializeVector(await generateEmbedding(parsed.data.notes));
    } catch (error) {
      console.error("Service-entry embedding generation failed:", error);
    }
  }

  if (!customFields.success) {
    return {
      fieldErrors: customFields.fieldErrors,
      message: "Fix the highlighted custom fields and try again.",
      status: "error",
    };
  }

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

  const { data: entry, error } = await supabase
    .from("service_entries")
    .insert({
      client_id: client.id,
      embedding,
      notes: parsed.data.notes,
      service_date: parsed.data.serviceDate,
      service_type_id: parsed.data.serviceTypeId,
      staff_member_name: getStaffDisplayName(profile, user.email),
      staff_member_profile_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !entry) {
    return {
      message: error?.message ?? "Could not save the service entry.",
      status: "error",
    };
  }

  await replaceServiceEntryCustomFieldValues(supabase, entry.id, customFields.values);

  revalidatePath("/dashboard");
  redirect(`/clients/${client.client_id}?logged=1`);
}
