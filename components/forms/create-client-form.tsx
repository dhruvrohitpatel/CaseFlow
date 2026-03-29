"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { Camera, FileImage, Sparkles, TriangleAlert } from "lucide-react";

import {
  createClientAction,
  discardIntakeCaptureSessionAction,
  processIntakePhotoAction,
} from "@/app/actions/clients";
import { DynamicFields } from "@/components/forms/dynamic-fields";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/form-state";
import type { CustomFieldDefinition } from "@/lib/custom-fields";
import {
  formatUploadLimit,
  INTAKE_PHOTO_UPLOAD_RULE,
  validateUploadFile,
} from "@/lib/uploads";

const fieldErrorClassName = "text-sm text-red-700";
const nativeSelectClassName =
  "flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

type CreateClientFormProps = {
  adminAiEnabled: boolean;
  adminAiPlanLabel: string;
  adminAiUnavailableMessage: string;
  customFieldDefinitions?: CustomFieldDefinition[];
  intakeSession?: {
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
  } | null;
};

export function CreateClientForm({
  adminAiEnabled,
  adminAiPlanLabel,
  adminAiUnavailableMessage,
  customFieldDefinitions = [],
  intakeSession = null,
}: CreateClientFormProps) {
  const [state, formAction] = useActionState(createClientAction, initialActionState);
  const [photoState, photoAction] = useActionState(processIntakePhotoAction, initialActionState);
  const [intakePhotoError, setIntakePhotoError] = useState<string | null>(null);
  const intakeInitialValues = intakeSession?.coreValues ?? {};

  function handleIntakePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    setIntakePhotoError(
      nextFile ? validateUploadFile(nextFile, INTAKE_PHOTO_UPLOAD_RULE) : null,
    );
  }

  function renderConfidenceBadge(level?: string) {
    if (level === "low") {
      return (
        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
          Low confidence
        </span>
      );
    }

    if (level === "medium") {
      return (
        <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
          Review suggested
        </span>
      );
    }

    return null;
  }

  function getSelectChoices(options: string[], currentValue?: string | null) {
    if (currentValue && !options.includes(currentValue)) {
      return [currentValue, ...options];
    }

    return options;
  }

  return (
    <div className="space-y-6">
      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Photo-to-intake</CardTitle>
            <Badge variant="outline">{adminAiPlanLabel}</Badge>
          </div>
          <CardDescription>
            Upload a paper intake form to prefill the client record. Staff always review the extracted values before submit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminAiEnabled ? (
            <form action={photoAction} className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.32)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-stone-900 p-2 text-white">
                      <Camera className="size-4" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-stone-950">Start from photo</p>
                      <p className="text-sm text-stone-600">
                        Use a phone camera or upload a flat image of the intake form. Supported files: JPG, PNG, WEBP.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="intakePhoto">Intake image</Label>
                    <Input
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      id="intakePhoto"
                      name="intakePhoto"
                      onChange={handleIntakePhotoSelection}
                      type="file"
                    />
                    <p className="text-xs text-stone-500">
                      Supported files: JPG, PNG, WEBP. Max {formatUploadLimit(INTAKE_PHOTO_UPLOAD_RULE.maxBytes)}.
                    </p>
                    {intakePhotoError ? <p className={fieldErrorClassName}>{intakePhotoError}</p> : null}
                  </div>
                </div>
                <FormMessage message={photoState.message} tone={photoState.status === "success" ? "success" : "error"} />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-stone-600">
                    Manual entry remains available below. AI only prepares a draft.
                  </p>
                  <SubmitButton disabled={Boolean(intakePhotoError)} pendingLabel="Reading intake photo...">Process intake photo</SubmitButton>
                </div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileImage className="size-4 text-stone-500" />
                  <p className="font-medium text-stone-950">How this works</p>
                </div>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
                  <li>1. Upload or capture the paper form.</li>
                  <li>2. CaseFlow extracts supported client and custom fields.</li>
                  <li>3. Staff review the draft and submit the final client record.</li>
                </ol>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.38)] p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-stone-500" />
                <p className="font-medium text-stone-950">Photo-to-intake is optional</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-600">{adminAiUnavailableMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {intakeSession ? (
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Review extracted intake</CardTitle>
              <Badge className="brand-chip border-0">Ready for review</Badge>
            </div>
            <CardDescription>
              Review the extracted values before creating the client. Source image: {intakeSession.sourceFilename}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                {intakeSession.sourceImageUrl ? (
                  <img
                    alt="Uploaded intake form"
                    className="h-full w-full object-contain"
                    src={intakeSession.sourceImageUrl}
                  />
                ) : (
                  <div className="flex min-h-64 items-center justify-center text-sm text-stone-500">
                    Image preview unavailable.
                  </div>
                )}
              </div>
              <form action={discardIntakeCaptureSessionAction}>
                <input name="intakeSessionId" type="hidden" value={intakeSession.id} />
                <Button type="submit" variant="outline">Discard photo session</Button>
              </form>
            </div>
            <div className="space-y-4">
              {intakeSession.warnings.length ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <div className="flex items-center gap-2 font-medium">
                    <TriangleAlert className="size-4" />
                    Review items before submit
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {intakeSession.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Extraction completed. Review the form below before submit.
                </div>
              )}
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                Low-confidence fields are marked inline in the form.
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Register a client</CardTitle>
        <CardDescription>
          Enter client details directly or review the values extracted from a paper intake form.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2" key={intakeSession?.id ?? "manual"}>
          <input name="intakeSessionId" type="hidden" value={intakeSession?.id ?? ""} />
          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="fullName">Full name</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.fullName)}
            </div>
            <Input defaultValue={intakeInitialValues.fullName ?? ""} id="fullName" name="fullName" placeholder="Jordan Parker" />
            {state.fieldErrors?.fullName ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.fullName[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.dateOfBirth)}
            </div>
            <Input defaultValue={intakeInitialValues.dateOfBirth ?? ""} id="dateOfBirth" name="dateOfBirth" type="date" />
            {state.fieldErrors?.dateOfBirth ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.dateOfBirth[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="phone">Phone</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.phone)}
            </div>
            <Input defaultValue={intakeInitialValues.phone ?? ""} id="phone" name="phone" placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="email">Email</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.email)}
            </div>
            <Input defaultValue={intakeInitialValues.email ?? ""} id="email" name="email" placeholder="client@example.org" type="email" />
            {state.fieldErrors?.email ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="preferredName">Preferred name</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.preferredName)}
            </div>
            <Input defaultValue={intakeInitialValues.preferredName ?? ""} id="preferredName" name="preferredName" placeholder="Jo" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="preferredLanguage">Preferred language</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.preferredLanguage)}
            </div>
            <select
              className={nativeSelectClassName}
              defaultValue={intakeInitialValues.preferredLanguage ?? "English"}
              id="preferredLanguage"
              name="preferredLanguage"
            >
              {getSelectChoices(["English", "Spanish", "Arabic", "French", "Other"], intakeInitialValues.preferredLanguage).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {state.fieldErrors?.preferredLanguage ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.preferredLanguage[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="pronouns">Pronouns</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.pronouns)}
            </div>
            <Input defaultValue={intakeInitialValues.pronouns ?? ""} id="pronouns" name="pronouns" placeholder="she/her" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="housingStatus">Housing status</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.housingStatus)}
            </div>
            <select
              className={nativeSelectClassName}
              defaultValue={intakeInitialValues.housingStatus ?? "Stable housing"}
              id="housingStatus"
              name="housingStatus"
            >
              {getSelectChoices(
                ["Stable housing", "Temporary housing", "Unsheltered", "Staying with family or friends"],
                intakeInitialValues.housingStatus,
              ).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {state.fieldErrors?.housingStatus ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.housingStatus[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="referralSource">Referral source</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.referralSource)}
            </div>
            <select
              className={nativeSelectClassName}
              defaultValue={intakeInitialValues.referralSource ?? "Walk-in"}
              id="referralSource"
              name="referralSource"
            >
              {getSelectChoices(["Walk-in", "Community partner", "Hotline", "Hospital", "School"], intakeInitialValues.referralSource).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {state.fieldErrors?.referralSource ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.referralSource[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="status">Client status</Label>
              {renderConfidenceBadge(intakeSession?.confidence.core.status)}
            </div>
            <select
              className={nativeSelectClassName}
              defaultValue={intakeInitialValues.status ?? "active"}
              id="status"
              name="status"
            >
              {getSelectChoices(["active", "inactive", "archived"], intakeInitialValues.status).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {state.fieldErrors?.status ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.status[0]}</p>
            ) : null}
          </div>
          <DynamicFields
            confidenceByDefinitionId={intakeSession?.confidence.custom}
            definitions={customFieldDefinitions}
            fieldErrors={state.fieldErrors}
            initialValues={intakeSession?.customValues}
          />
          <div className="md:col-span-2">
            <FormMessage
              message={state.message}
              tone={state.status === "success" ? "success" : "error"}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <SubmitButton pendingLabel="Creating client...">Create client</SubmitButton>
          </div>
        </form>
      </CardContent>
      </Card>
    </div>
  );
}
