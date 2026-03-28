import { redirect } from "next/navigation";

import type { User } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function ensureProfile(user: User) {
  const supabase = await createSupabaseServerClient();
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw new Error(existingProfileError.message);
  }

  if (existingProfile) {
    return existingProfile;
  }

  const profilePayload = {
    email: user.email ?? "",
    full_name:
      typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : null,
    id: user.id,
  };

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(profilePayload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return profile;
}

export async function getCurrentSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await ensureProfile(user);

  return {
    profile,
    supabase,
    user,
  };
}

export async function requireCurrentSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(roles: ProfileRow["role"][]) {
  const session = await requireCurrentSession();

  if (!roles.includes(session.profile.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  return session;
}

export function getStaffDisplayName(profile: ProfileRow, fallbackEmail?: string) {
  if (profile.full_name?.trim()) {
    return profile.full_name.trim();
  }

  return fallbackEmail ?? profile.email;
}
