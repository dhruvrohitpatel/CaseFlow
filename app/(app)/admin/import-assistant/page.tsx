import Link from "next/link";

import {
  analyzeImportAssistantAction,
  confirmImportAssistantAction,
} from "@/app/actions/import-assistant";
import { ImportAssistantAnalyzeForm } from "@/components/forms/import-assistant-analyze-form";
import { PageErrorState } from "@/components/ui/page-error-state";
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

function resolveError(error?: string, message?: string) {
  if (message?.trim()) {
    return message;
  }

  switch (error) {
    case "admin-ai-disabled":
      return "Premium admin AI is not enabled for this workspace.";
    case "assistant-unavailable":
      return "Premium admin AI is unavailable right now. Use the included templates and manual import workflow.";
    case "missing-file":
      return "Choose a CSV file before starting the import assistant.";
    case "save-failed":
      return "The import session could not be saved.";
    case "session":
      return "That import session could not be loaded.";
    case "no-rows":
      return "No normalized rows were available to import.";
    default:
      return error ? "The import assistant request failed." : null;
  }
}

export default async function ImportAssistantPage({
  searchParams,
}: ImportAssistantPageProps) {
  await requireRole(["admin"]);
  const adminAi = getAiFeatureState("admin_ai");
  const params = await searchParams;
  const supabase = createSupabaseAdminClient();
  const sessionId = params.session?.trim() || null;
  const [
    { data: currentSession, error: currentSessionError },
    { data: recentSessions, error: recentError },
  ] = await Promise.all([
    sessionId
      ? supabase
          .from("import_assistant_sessions")
          .select("*")
          .eq("id", sessionId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("import_assistant_sessions")
      .select("id, source_filename, target_entity, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const errorMessage = resolveError(params.error, params.message);
  const pageErrorMessage = recentError?.message ?? currentSessionError?.message ?? null;
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
          Import completed.
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {pageErrorMessage ? (
        <PageErrorState description={pageErrorMessage} title="Some import assistant data could not be loaded." />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Import assistant</h1>
          <p className="mt-2 text-sm text-stone-600">
            Download the standard templates, then use premium admin AI for mapping suggestions only when this workspace enables it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/admin">
            Back to admin
          </Link>
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/samples/demo-clients.csv">
            Sample clients CSV
          </Link>
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/samples/demo-service-entries.csv">
            Sample service CSV
          </Link>
          <Link className="inline-flex h-9 items-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-900 hover:bg-stone-100" href="/samples/demo-appointments.csv">
            Sample appointments CSV
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Included in base</Badge>
        <Badge variant="outline">{adminAi.planLabel}</Badge>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Analyze CSV</CardTitle>
            <CardDescription>
              {adminAi.enabled
                ? "The model suggests the target entity and field mapping. The app validates and previews the rows before import."
                : "Base plan guidance includes templates and manual preparation. AI-assisted mapping is optional premium admin AI."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminAi.enabled ? (
              <ImportAssistantAnalyzeForm action={analyzeImportAssistantAction} />
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-5 py-6 text-sm text-stone-600">
                AI-assisted CSV mapping is optional. Use the sample files on this page as the standard format for manual preparation, then return when premium admin AI is enabled.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
            <CardDescription>Reopen a recent mapping session or review the current one below.</CardDescription>
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
                No import sessions yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {currentSession ? (
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>Review session</CardTitle>
              <CardDescription>
                Target entity: {currentSession.target_entity}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-stone-950">Confidence summary</p>
                <p className="mt-2 text-sm text-stone-600">
                  {String((currentSession.mapping_plan as { confidence_summary?: string })?.confidence_summary ?? "No summary")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-950">Warnings</p>
                <div className="mt-2 space-y-2">
                  {warnings.length ? warnings.map((warning) => (
                    <div key={warning} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600">
                      {warning}
                    </div>
                  )) : (
                    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600">
                      No warnings.
                    </div>
                  )}
                </div>
              </div>
              <form action={confirmImportAssistantAction}>
                <input name="sessionId" type="hidden" value={currentSession.id} />
                <Button disabled={currentSession.status === "imported"} type="submit">
                  {currentSession.status === "imported" ? "Already imported" : "Confirm import"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="brand-card border shadow-sm">
            <CardHeader>
              <CardTitle>Header mapping</CardTitle>
              <CardDescription>AI suggested this mapping. The app applies it deterministically after review.</CardDescription>
            </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source header</TableHead>
                      <TableHead>Target field</TableHead>
                      <TableHead>Transform</TableHead>
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
                <CardTitle>Preview rows</CardTitle>
                <CardDescription>First 10 normalized rows that will be imported.</CardDescription>
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
                    No preview rows were generated.
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
