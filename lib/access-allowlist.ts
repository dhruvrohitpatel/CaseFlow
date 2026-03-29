import type { User } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export class AccessNotApprovedError extends Error {
  constructor(message = "This email is not approved for CaseFlow access.") {
    super(message);
    this.name = "AccessNotApprovedError";
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getAllowlistEntryByEmail(email: string) {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("access_allowlist")
    .select("*")
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function syncClientLinkForRole(
  role: ProfileRow["role"],
  profileId: string,
  email: string,
  linkedClientId: string | null,
) {
  const adminClient = createSupabaseAdminClient();

  if (role !== "client") {
    const { error } = await adminClient
      .from("clients")
      .update({
        portal_profile_id: null,
      })
      .eq("portal_profile_id", profileId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  if (!linkedClientId) {
    throw new AccessNotApprovedError("Client access is missing a linked client record.");
  }

  const { error: clearError } = await adminClient
    .from("clients")
    .update({
      portal_profile_id: null,
    })
    .eq("portal_profile_id", profileId)
    .neq("id", linkedClientId);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const { error: linkError } = await adminClient
    .from("clients")
    .update({
      email,
      portal_profile_id: profileId,
    })
    .eq("id", linkedClientId);

  if (linkError) {
    throw new Error(linkError.message);
  }
}

export async function syncUserAccessFromAllowlist(
  user: Pick<User, "email" | "id" | "user_metadata">,
) {
  if (!user.email) {
    throw new AccessNotApprovedError();
  }

  const email = normalizeEmail(user.email);
  const allowlistEntry = await getAllowlistEntryByEmail(email);

  if (!allowlistEntry || !allowlistEntry.is_active) {
    throw new AccessNotApprovedError();
  }

  const adminClient = createSupabaseAdminClient();
  const { data: existingProfile, error: existingProfileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(existingProfileError.message);
  }

  const metadataName =
    typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : null;

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      email,
      full_name: metadataName ?? existingProfile?.full_name ?? null,
      id: user.id,
      must_reset_password: false,
      role: allowlistEntry.role,
    })
    .select("*")
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  await syncClientLinkForRole(
    allowlistEntry.role,
    user.id,
    email,
    allowlistEntry.linked_client_id,
  );

  return {
    allowlistEntry,
    profile,
  };
}
