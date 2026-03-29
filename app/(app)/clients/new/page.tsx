import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CreateClientForm } from "@/components/forms/create-client-form";
import { PageErrorState } from "@/components/ui/page-error-state";
import { getAiFeatureState } from "@/lib/ai/capabilities";
import { getActiveCustomFieldDefinitions } from "@/lib/custom-fields";
import { requireRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const outlineLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";

type NewClientPageProps = {
  searchParams: Promise<{
    discarded?: string;
    intake?: string;
  }>;
};

export default async function NewClientPage({
  searchParams,
}: NewClientPageProps) {
  const [{ profile, supabase }, params] = await Promise.all([
    requireRole(["admin", "staff"]),
    searchParams,
  ]);
  const customFieldDefinitionsResult = await getActiveCustomFieldDefinitions(
    supabase,
    "client",
  )
    .then((data) => ({ data, error: null }))
    .catch((error: unknown) => ({
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Client field definitions could not be loaded.",
    }));
  const customFieldDefinitions = customFieldDefinitionsResult.data;
  const adminAi = getAiFeatureState("admin_ai");
  const intakeSessionId = params.intake?.trim() || null;
  const adminSupabase = createSupabaseAdminClient();
  let pageError = customFieldDefinitionsResult.error;
  let intakeSession: {
    confidence: {
      core: Record<string, string>;
      custom: Record<string, string>;
    };
    coreValues: Record<string, string>;
    customValues: Record<string, string>;
    id: string;
    sourceFilename: string;
    sourceImageUrl: string | null;
    warnings: string[];
  } | null = null;

  if (intakeSessionId) {
    const { data, error } = await adminSupabase
      .from("intake_capture_sessions")
      .select("*")
      .eq("id", intakeSessionId)
      .maybeSingle();

    if (error && !pageError) {
      pageError = error.message;
    }

    if (data && (profile.role === "admin" || data.created_by === profile.id)) {
      const { data: signedUrl, error: signedUrlError } = await adminSupabase.storage
        .from("intake-source-images")
        .createSignedUrl(data.source_image_path, 60 * 30);

      if (signedUrlError && !pageError) {
        pageError = signedUrlError.message;
      }
      const extractedCustomValues = Array.isArray(data.custom_fields_json)
        ? (data.custom_fields_json as Array<{
            definitionId?: string;
            value?: string;
          }>).reduce<Record<string, string>>((accumulator, entry) => {
            if (entry.definitionId && typeof entry.value === "string") {
              accumulator[entry.definitionId] = entry.value;
            }

            return accumulator;
          }, {})
        : {};

      intakeSession = {
        confidence: {
          core:
            typeof data.confidence_json === "object" &&
            data.confidence_json !== null &&
            "core" in data.confidence_json
              ? ((data.confidence_json as { core?: Record<string, string> }).core ?? {})
              : {},
          custom:
            typeof data.confidence_json === "object" &&
            data.confidence_json !== null &&
            "custom" in data.confidence_json
              ? ((data.confidence_json as { custom?: Record<string, string> }).custom ?? {})
              : {},
        },
        coreValues:
          typeof data.core_fields_json === "object" && data.core_fields_json !== null
            ? Object.entries(data.core_fields_json as Record<string, unknown>).reduce<Record<string, string>>(
                (accumulator, [key, value]) => {
                  if (typeof value === "string" && value.trim()) {
                    accumulator[key] = value;
                  }

                  return accumulator;
                },
                {},
              )
            : {},
        customValues: extractedCustomValues,
        id: data.id,
        sourceFilename: data.source_filename,
        sourceImageUrl: signedUrl?.signedUrl ?? null,
        warnings: Array.isArray(data.warnings_json) ? (data.warnings_json as string[]) : [],
      };
    }
  }

  return (
      <div className="space-y-6">
      {pageError ? (
        <PageErrorState description={pageError} title="Part of the intake form is unavailable." />
      ) : null}
      {params.discarded === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Intake photo session discarded.
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">New client</h1>
          <p className="mt-2 text-sm text-stone-600">
            Create a client record with core contact and demographic details.
          </p>
        </div>
        <Link className={outlineLinkClassName} href="/clients">
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
      </div>
      <CreateClientForm
        adminAiEnabled={adminAi.enabled}
        adminAiPlanLabel={adminAi.planLabel}
        adminAiUnavailableMessage={adminAi.unavailableMessage}
        customFieldDefinitions={customFieldDefinitions}
        intakeSession={intakeSession}
      />
    </div>
  );
}
