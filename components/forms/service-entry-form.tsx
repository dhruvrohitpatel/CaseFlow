"use client";

import { useActionState } from "react";

import { createServiceEntryAction } from "@/app/actions/service-entries";
import { DynamicFields } from "@/components/forms/dynamic-fields";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions/form-state";
import type { CustomFieldDefinition } from "@/lib/custom-fields";
import type { Database } from "@/lib/database.types";

type ServiceType = Database["public"]["Tables"]["service_types"]["Row"];

type ServiceEntryFormProps = {
  clientPublicId: string;
  customFieldDefinitions?: CustomFieldDefinition[];
  serviceTypes: ServiceType[];
  staffMemberName: string;
};

const nativeSelectClassName =
  "flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

export function ServiceEntryForm({
  clientPublicId,
  customFieldDefinitions = [],
  serviceTypes,
  staffMemberName,
}: ServiceEntryFormProps) {
  const [state, formAction] = useActionState(
    createServiceEntryAction,
    initialActionState,
  );

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Log a service or visit</CardTitle>
        <CardDescription>
          Capture the service date, service type, staff member, and note summary.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input name="clientPublicId" type="hidden" value={clientPublicId} />
          <div className="space-y-2">
            <Label htmlFor="serviceDate">Date</Label>
            <Input defaultValue={new Date().toISOString().slice(0, 10)} id="serviceDate" name="serviceDate" type="date" />
            {state.fieldErrors?.serviceDate ? (
              <p className="text-sm text-red-700">{state.fieldErrors.serviceDate[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceTypeId">Service type</Label>
            <select className={nativeSelectClassName} id="serviceTypeId" name="serviceTypeId">
              {serviceTypes.map((serviceType) => (
                <option key={serviceType.id} value={serviceType.id}>
                  {serviceType.name}
                </option>
              ))}
            </select>
            {state.fieldErrors?.serviceTypeId ? (
              <p className="text-sm text-red-700">{state.fieldErrors.serviceTypeId[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="staffMember">Staff member</Label>
            <Input disabled id="staffMember" value={staffMemberName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Summarize the visit, resources provided, and next step." rows={5} />
            {state.fieldErrors?.notes ? (
              <p className="text-sm text-red-700">{state.fieldErrors.notes[0]}</p>
            ) : null}
          </div>
          <DynamicFields
            definitions={customFieldDefinitions}
            fieldErrors={state.fieldErrors}
          />
          <FormMessage
            message={state.message}
            tone={state.status === "success" ? "success" : "error"}
          />
          <div className="flex justify-end">
            <SubmitButton pendingLabel="Saving entry...">Save service entry</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
