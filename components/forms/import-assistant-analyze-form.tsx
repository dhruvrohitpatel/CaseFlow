"use client";

import { useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { CSV_UPLOAD_RULE, formatUploadLimit, validateUploadFile } from "@/lib/uploads";

type ImportAssistantAnalyzeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function ImportAssistantAnalyzeForm({
  action,
}: ImportAssistantAnalyzeFormProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    setFileError(nextFile ? validateUploadFile(nextFile, CSV_UPLOAD_RULE) : null);
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-950" htmlFor="csvFile">
          CSV file
        </label>
        <input
          accept=".csv,text/csv"
          className="block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950"
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
      <Button disabled={Boolean(fileError)} type="submit">
        Analyze file
      </Button>
    </form>
  );
}
