"use client";

import { useActionState } from "react";

import { createClientAction } from "@/app/actions/clients";
import { DynamicFields } from "@/components/forms/dynamic-fields";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/form-state";
import type { CustomFieldDefinition } from "@/lib/custom-fields";

const fieldErrorClassName = "text-sm text-red-700";
const nativeSelectClassName =
  "flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

type CreateClientFormProps = {
  customFieldDefinitions?: CustomFieldDefinition[];
};

export function CreateClientForm({
  customFieldDefinitions = [],
}: CreateClientFormProps) {
  const [state, formAction] = useActionState(createClientAction, initialActionState);

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Register a client</CardTitle>
        <CardDescription>
          Capture the minimum information staff need to get someone into the system quickly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" placeholder="Jordan Parker" />
            {state.fieldErrors?.fullName ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.fullName[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" />
            {state.fieldErrors?.dateOfBirth ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.dateOfBirth[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" placeholder="client@example.org" type="email" />
            {state.fieldErrors?.email ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredName">Preferred name</Label>
            <Input id="preferredName" name="preferredName" placeholder="Jo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Preferred language</Label>
            <select className={nativeSelectClassName} defaultValue="English" id="preferredLanguage" name="preferredLanguage">
              <option>English</option>
              <option>Spanish</option>
              <option>Arabic</option>
              <option>French</option>
              <option>Other</option>
            </select>
            {state.fieldErrors?.preferredLanguage ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.preferredLanguage[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pronouns">Pronouns</Label>
            <Input id="pronouns" name="pronouns" placeholder="she/her" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="housingStatus">Housing status</Label>
            <select className={nativeSelectClassName} defaultValue="Stable housing" id="housingStatus" name="housingStatus">
              <option>Stable housing</option>
              <option>Temporary housing</option>
              <option>Unsheltered</option>
              <option>Staying with family or friends</option>
            </select>
            {state.fieldErrors?.housingStatus ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.housingStatus[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="referralSource">Referral source</Label>
            <select className={nativeSelectClassName} defaultValue="Walk-in" id="referralSource" name="referralSource">
              <option>Walk-in</option>
              <option>Community partner</option>
              <option>Hotline</option>
              <option>Hospital</option>
              <option>School</option>
            </select>
            {state.fieldErrors?.referralSource ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.referralSource[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Client status</Label>
            <select className={nativeSelectClassName} defaultValue="active" id="status" name="status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
            {state.fieldErrors?.status ? (
              <p className={fieldErrorClassName}>{state.fieldErrors.status[0]}</p>
            ) : null}
          </div>
          <DynamicFields
            definitions={customFieldDefinitions}
            fieldErrors={state.fieldErrors}
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
  );
}
