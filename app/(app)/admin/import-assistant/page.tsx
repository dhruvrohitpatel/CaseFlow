import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  analyzeImportAssistantAction,
  confirmImportAssistantAction,
} from "@/app/actions/import-assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAiFeatureState } from "@/lib/ai/capabilities";
import { requireRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ImportAssistantPageProps = {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    message?: string;
    session?: string;
  }>;
};

export default async function ImportAssistantPage({
  searchParams,
}: ImportAssistantPageProps) {
  await requireRole(["admin"]);
  const adminAi = getAiFeatureState("admin_ai");
  const [params, t] = await Promise.all([searchParams, getTranslations("ImportAssistantPage")]);

  function resolveError(error?: string, message?: string) {
    if (message?.trim()) {
      return message;
    }

    switch (error) {
      case "admin-ai-disabled":
        return t("errorAdminAiDisabled");
      case "assistant-unavailable":
        return t("errorAssistantUnavailable");
      case "missing-file":
        return t("errorMissingFile");
      case "save-failed":
        return t("errorSaveFailed");
      case "session":
        return t("errorSession");
      case "no-rows":
        return t("errorNoRows");
      default:
        return error ? t("errorGeneric") : null;
    }
  }

  const supabase = createSupabaseAdminClient();
  const sessionId = params.session?.trim() || null;
  const [{ data: currentSession }, { data: recentSessions, error: recentError }] =
    await Promise.all([
      sessionId
        ? supabase
            .from("import_assistant_sessions")
            .select("*")
            .eq("id", sessionId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("import_assistant_sessions")
        .select("id, source_filename, target_entity, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  if (recentError) {
    throw new Error(recentError.message);
  }

  const errorMessage = resolveError(params.error, params.message);
  const previewRows = Array.isArray(currentSession?.preview_rows)
    ? (currentSession.preview_rows as Array<Record<string, string | null>>).slice(0, 10)
    : [];
  const headerMappings = Array.isArray((currentSession?.mapping_plan as { header_mappings?: unknown })?.header_mappings)
    ? ((currentSession?.mapping_plan as { header_mappings: Array<{ source_header: string; target_field: string; transform_hint: string }> }).header_mappings)
    : [];
  const warnings = Array.isArray(currentSession?.warnings)
    ? (currentSession.warnings as string[])
    : [];

  return (
    <div className="space-y-6">
      {params.imported === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("successImported")}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{t("pageTitle")}</h1>
          <p className="mt-2 text-sm text-stone-600">
            {t("pageDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/admin">
            {t("backToAdmin")}
          </Link>
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/samples/demo-clients.csv">
            {t("sampleClientsCsv")}
          </Link>
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/samples/demo-service-entries.csv">
            {t("sampleServiceCsv")}
          </Link>
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/samples/demo-appointments.csv">
            {t("sampleAppointmentsCsv")}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{t("includedInBase")}</Badge>
        <Badge variant="outline">{adminAi.planLabel}</Badge>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>{t("analyzeCardTitle")}</CardTitle>
            <CardDescription>
              {adminAi.enabled
                ? t("analyzeCardDescriptionAi")
                : t("analyzeCardDescriptionBase")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminAi.enabled ? (
              <form action={analyzeImportAssistantAction} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-950" htmlFor="csvFile">{t("csvFileLabel")}</label>
                  <input accept=".csv,text/csv" className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950" id="csvFile" name="csvFile" type="file" />
                </div>
                <Button type="submit">{t("analyzeButton")}</Button>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-5 py-6 text-sm text-stone-600">
                {t("aiDisabledHint")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>{t("recentSessionsTitle")}</CardTitle>
            <CardDescription>{t("recentSessionsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions?.length ? (
              recentSessions.map((session) => (
                <Link key={session.id} className="block rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:bg-stone-50" href={`/admin/import-assistant?session=${session.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-950">{session.source_filename}</p>
                      <p className="mt-1 text-sm text-stone-600">{session.target_entity} • {session.status}</p>
                    </div>
                    <p className="text-xs text-stone-500">{new Date(session.created_at).toLocaleString()}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
                {t("emptyRecentSessions")}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {currentSession ? (
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>{t("reviewSessionTitle")}</CardTitle>
              <CardDescription>
                Target entity: {currentSession.target_entity}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-stone-950">{t("confidenceSummaryLabel")}</p>
                <p className="mt-2 text-sm text-stone-600">
                  {String((currentSession.mapping_plan as { confidence_summary?: string })?.confidence_summary ?? t("noSummary"))}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-950">{t("warningsLabel")}</p>
                <div className="mt-2 space-y-2">
                  {warnings.length ? warnings.map((warning) => (
                    <div key={warning} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600">
                      {warning}
                    </div>
                  )) : (
                    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600">
                      {t("noWarnings")}
                    </div>
                  )}
                </div>
              </div>
              <form action={confirmImportAssistantAction}>
                <input name="sessionId" type="hidden" value={currentSession.id} />
                <Button disabled={currentSession.status === "imported"} type="submit">
                  {currentSession.status === "imported" ? t("alreadyImported") : t("confirmImport")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>{t("headerMappingTitle")}</CardTitle>
              <CardDescription>{t("headerMappingDescription")}</CardDescription>
            </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("tableHeadSourceHeader")}</TableHead>
                      <TableHead>{t("tableHeadTargetField")}</TableHead>
                      <TableHead>{t("tableHeadTransform")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {headerMappings.map((mapping) => (
                      <TableRow key={`${mapping.source_header}-${mapping.target_field}`}>
                        <TableCell>{mapping.source_header}</TableCell>
                        <TableCell>{mapping.target_field}</TableCell>
                        <TableCell>{mapping.transform_hint}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="brand-card border shadow-sm">
              <CardHeader>
                <CardTitle>{t("previewRowsTitle")}</CardTitle>
                <CardDescription>{t("previewRowsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {previewRows.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(previewRows[0] ?? {}).map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, index) => (
                        <TableRow key={`preview-${index}`}>
                          {Object.keys(previewRows[0] ?? {}).map((header) => (
                            <TableCell key={`${index}-${header}`}>{row[header] ?? ""}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
                    {t("emptyPreviewRows")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}
    </div>
  );
}
