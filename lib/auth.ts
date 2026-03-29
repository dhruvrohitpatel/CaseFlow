import { redirect } from "next/navigation";

import {
  AccessNotApprovedError,
  syncUserAccessFromAllowlist,
} from "@/lib/access-allowlist";
import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = ProfileRow["role"];

const dashboardPathByRole: Record<AppRole, string> = {
  admin: "/dashboard/admin",
  client: "/dashboard/client",
  staff: "/dashboard/staff",
};

export function getDashboardPathForRole(role: AppRole) {
  return dashboardPathByRole[role];
}

async function resolveSession(redirectOnDenied: boolean) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  try {
    const { profile } = await syncUserAccessFromAllowlist(user);

    return {
      profile,
      supabase,
      user,
    };
  } catch (error) {
    if (error instanceof AccessNotApprovedError) {
      await supabase.auth.signOut();

      if (redirectOnDenied) {
        redirect("/login?error=not-approved");
      }

      return null;
    }

    throw error;
  }
}

export async function getCurrentSession() {
  return resolveSession(false);
}

export async function requireCurrentSession() {
  const session = await resolveSession(true);

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAppSession() {
  const session = await requireCurrentSession();

  return session;
}

export async function requireRole(roles: ProfileRow["role"][]) {
  const session = await requireAppSession();

  if (!roles.includes(session.profile.role)) {
    redirect(`${getDashboardPathForRole(session.profile.role)}?error=unauthorized`);
  }

  return session;
}

export function getStaffDisplayName(profile: ProfileRow, fallbackEmail?: string) {
  if (profile.full_name?.trim()) {
    return profile.full_name.trim();
  }

  return fallbackEmail ?? profile.email;
}

export async function getPortalClientForCurrentUser() {
  const { profile, supabase } = await requireRole(["client"]);
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_profile_id", profile.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!client) {
    redirect("/login?error=portal-missing");
  }

  return {
    client,
    profile,
    supabase,
  };
}
