import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { OrganizationSetupForms } from "@/components/forms/organization-setup-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAiFeatureState } from "@/lib/ai/capabilities";
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
  const [{ profile, supabase }, settings, params, t] = await Promise.all([
    requireRole(["admin"]),
    getOrganizationSettings(),
    searchParams,
    getTranslations("SetupPage"),
  ]);
  const adminAi = getAiFeatureState("admin_ai");
  const [{ count: accessCount, error: accessError }, { data: themeDrafts, error: themeDraftError }] =
    await Promise.all([
      supabase.from("access_allowlist").select("*", { count: "exact", head: true }),
      supabase
        .from("organization_theme_drafts")
        .select("id, created_at, prompt, theme_recipe, applied_at")
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

  if (accessError || themeDraftError) {
    throw new Error(accessError?.message ?? themeDraftError?.message);
  }

  const steps = getSetupChecklist(settings);
  const complete = isSetupComplete(settings);

  return (
    <div className="space-y-6">
      {params.saved === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("successSaved")}
        </div>
      ) : null}
      {params.error === "step" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("errorStep")}
        </div>
      ) : null}

      <Card className="brand-card border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t("cardTitle")}</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6 text-stone-600">
            {t("cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-stone-200 bg-white/85 px-4 py-2 text-sm font-medium text-stone-950">
            {t("signedInAs", { name: profile.full_name ?? profile.email })}
          </div>
          <div className="rounded-full border border-stone-200 bg-white/85 px-4 py-2 text-sm text-stone-600">
            {t("deployWorkflow")}
          </div>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
            href={complete ? getDashboardPathForRole(profile.role) : "/admin"}
          >
            {complete ? t("openDashboard") : t("openAdminTools")}
          </Link>
        </CardContent>
      </Card>

      <OrganizationSetupForms
        accessCount={accessCount ?? 0}
        adminAiEnabled={adminAi.enabled}
        adminAiPlanLabel={adminAi.planLabel}
        adminAiUnavailableMessage={adminAi.unavailableMessage}
        organizationSettings={settings}
        steps={steps}
        themeDrafts={(themeDrafts ?? []) as Array<{
          applied_at: string | null;
          created_at: string;
          id: string;
          prompt: string;
          theme_recipe: Record<string, string | null>;
        }>}
      />
    </div>
  );
}
