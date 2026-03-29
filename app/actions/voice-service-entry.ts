"use server";

import { getStaffDisplayName, requireRole } from "@/lib/auth";

type SaveVoiceServiceEntryInput = {
  clientPublicId: string;
  notes: string;
  serviceTypeId: string;
  serviceDate: string;
};

type SaveResult =
  | { success: true; clientPublicId: string }
  | { success: false; error: string };

export async function saveVoiceServiceEntryAction(
  input: SaveVoiceServiceEntryInput,
): Promise<SaveResult> {
  const { clientPublicId, notes, serviceTypeId, serviceDate } = input;

  if (!clientPublicId || !notes || !serviceTypeId || !serviceDate) {
    return { success: false, error: "Missing required fields." };
  }

  if (notes.trim().length < 10) {
    return { success: false, error: "Notes must be at least 10 characters." };
  }

  const { profile, supabase, user } = await requireRole(["admin", "staff"]);

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, client_id")
    .eq("client_id", clientPublicId)
    .single();

  if (clientError || !client) {
    return { success: false, error: "Client not found." };
  }

  const { error } = await supabase.from("service_entries").insert({
    client_id: client.id,
    notes: notes.trim(),
    service_date: serviceDate,
    service_type_id: serviceTypeId,
    staff_member_name: getStaffDisplayName(profile, user.email),
    staff_member_profile_id: profile.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, clientPublicId: client.client_id };
}
