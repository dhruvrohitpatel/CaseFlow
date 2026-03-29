"use client";

import { useActionState, useState, type ChangeEvent } from "react";

import { importClientsCsvAction, type CsvImportState } from "@/app/actions/admin";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CSV_UPLOAD_RULE, formatUploadLimit, validateUploadFile } from "@/lib/uploads";

export function ClientCsvImportForm() {
  const initialCsvImportState: CsvImportState = {};
  const [state, formAction] = useActionState(
    importClientsCsvAction,
    initialCsvImportState,
  );
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    setFileError(nextFile ? validateUploadFile(nextFile, CSV_UPLOAD_RULE) : null);
  }

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Import clients from CSV</CardTitle>
        <CardDescription>
          Valid rows import immediately. Invalid rows stay visible with row-level errors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV file</Label>
            <input
              accept=".csv,text/csv"
              className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              id="csvFile"
              name="csvFile"
              onChange={handleFileSelection}
              type="file"
            />
            <p className="text-xs text-stone-500">
              Upload a `.csv` file up to {formatUploadLimit(CSV_UPLOAD_RULE.maxBytes)}.
            </p>
            {fileError ? <p className="text-sm text-red-700">{fileError}</p> : null}
          </div>
          <FormMessage
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
          <div className="flex justify-end">
            <SubmitButton disabled={Boolean(fileError)} pendingLabel="Importing...">Import CSV</SubmitButton>
          </div>
        </form>
        {typeof state.processed === "number" ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
            Processed {state.processed} rows. Imported {state.imported ?? 0}.
          </div>
        ) : null}
        {state.rowErrors && state.rowErrors.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Rows that need attention</p>
            <ul className="space-y-2 text-sm text-amber-800">
              {state.rowErrors.map((rowError) => (
                <li key={`${rowError.rowNumber}-${rowError.messages.join("|")}`}>
                  <strong>Row {rowError.rowNumber}:</strong> {rowError.messages.join(" ")}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
