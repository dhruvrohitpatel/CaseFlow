import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getDashboardPathForRole, requireAppSession } from "@/lib/auth";
import { getOrganizationSettings, isSetupComplete } from "@/lib/organization-settings";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const [{ profile }, settings, requestHeaders] = await Promise.all([
    requireAppSession(),
    getOrganizationSettings(),
    headers(),
  ]);
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const setupComplete = isSetupComplete(settings);
  const isSetupRoute = pathname.startsWith("/setup");
  const isAdminSafeRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin");

  if (profile.role === "admin" && !setupComplete && !isSetupRoute && !isAdminSafeRoute) {
    redirect("/setup");
  }

  if (profile.role !== "admin" && isSetupRoute) {
    redirect(getDashboardPathForRole(profile.role));
  }

  return (
    <AppShell organizationSettings={settings} profile={profile} setupComplete={setupComplete}>
      {children}
    </AppShell>
  );
}
