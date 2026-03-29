import Link from "next/link";

import { OrganizationSetupForms } from "@/components/forms/organization-setup-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageErrorState } from "@/components/ui/page-error-state";
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
  const [{ profile, supabase }, settingsResult, params] = await Promise.all([
    requireRole(["admin"]),
    getOrganizationSettings()
      .then((data) => ({ data, error: null }))
      .catch((error: unknown) => ({
        data: null,
        error: error instanceof Error ? error.message : "Setup settings could not be loaded.",
      })),
    searchParams,
  ]);
  const adminAi = getAiFeatureState("admin_ai");
  const settings = settingsResult.data;
  const [{ count: accessCount, error: accessError }, { data: themeDrafts, error: themeDraftError }] =
    settings
      ? await Promise.all([
          supabase.from("access_allowlist").select("*", { count: "exact", head: true }),
          supabase
            .from("organization_theme_drafts")
            .select("id, created_at, prompt, theme_recipe, applied_at")
            .order("created_at", { ascending: false })
            .limit(4),
        ])
      : [{ count: 0, error: null }, { data: [], error: null }];

  const pageError =
    settingsResult.error ?? accessError?.message ?? themeDraftError?.message ?? null;
  const steps = settings ? getSetupChecklist(settings) : [];
  const complete = settings ? isSetupComplete(settings) : false;

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
      {pageError ? (
        <PageErrorState description={pageError} title="Part of the setup guide is unavailable." />
      ) : null}

      <Card className="brand-card border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Setup guide</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6 text-stone-600">
            Finish branding, support details, access review, and starter-data planning so this deployment feels ready for a real nonprofit team instead of a half-configured workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
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

      {settings ? (
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
      ) : null}
    </div>
  );
}
