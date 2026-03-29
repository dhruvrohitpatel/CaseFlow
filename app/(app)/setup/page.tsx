import Link from "next/link";

import { OrganizationSetupForms } from "@/components/forms/organization-setup-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardPathForRole, requireRole } from "@/lib/auth";
import {
  getOrganizationSettings,
  getSetupChecklist,
  isSetupComplete,
} from "@/lib/organization-settings";

type SetupPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const [{ profile, supabase }, settings, params] = await Promise.all([
    requireRole(["admin"]),
    getOrganizationSettings(),
    searchParams,
  ]);
  const { count: accessCount, error: accessError } = await supabase
    .from("access_allowlist")
    .select("*", { count: "exact", head: true });

  if (accessError) {
    throw new Error(accessError.message);
  }

  const steps = getSetupChecklist(settings);
  const complete = isSetupComplete(settings);

  return (
    <div className="space-y-6">
      {params.saved === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Setup progress saved.
        </div>
      ) : null}
      {params.error === "step" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We could not update that setup step. Try again.
        </div>
      ) : null}

      <Card className="brand-gradient border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Launch this workspace like a product.</CardTitle>
          <CardDescription className="max-w-3xl text-base leading-7 text-stone-600">
            This setup guide turns the current deployment into a branded, nonprofit-specific workspace. Once branding, support details, access rules, and starter data are reviewed, your team can operate from the admin dashboard instead of tinkering with raw configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-stone-200 bg-white/85 px-4 py-2 text-sm font-medium text-stone-950">
            Signed in as {profile.full_name ?? profile.email}
          </div>
          <div className="rounded-full border border-stone-200 bg-white/85 px-4 py-2 text-sm text-stone-600">
            Deploy-per-org workflow active
          </div>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
            href={complete ? getDashboardPathForRole(profile.role) : "/admin"}
          >
            {complete ? "Open dashboard" : "Open admin tools"}
          </Link>
        </CardContent>
      </Card>

      <OrganizationSetupForms
        accessCount={accessCount ?? 0}
        organizationSettings={settings}
        steps={steps}
      />
    </div>
  );
}
