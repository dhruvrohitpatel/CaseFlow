"use client";

import { useActionState } from "react";

import { createCustomFieldDefinitionAction } from "@/app/actions/admin";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions/form-state";

const nativeSelectClassName =
  "flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

export function CustomFieldDefinitionForm() {
  const [state, formAction] = useActionState(
    createCustomFieldDefinitionAction,
    initialActionState,
  );

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Configure profile fields</CardTitle>
        <CardDescription>
          Add fields to client and service records. New fields appear in forms and profiles without changing code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="entityType">Record type</Label>
            <select className={nativeSelectClassName} defaultValue="client" id="entityType" name="entityType">
              <option value="client">Client profile</option>
              <option value="service_entry">Service log</option>
            </select>
            {state.fieldErrors?.entityType ? (
              <p className="text-sm text-red-700">{state.fieldErrors.entityType[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fieldType">Field type</Label>
            <select className={nativeSelectClassName} defaultValue="text" id="fieldType" name="fieldType">
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Select</option>
            </select>
            {state.fieldErrors?.fieldType ? (
              <p className="text-sm text-red-700">{state.fieldErrors.fieldType[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input id="label" name="label" placeholder="Emergency contact name" />
            {state.fieldErrors?.label ? (
              <p className="text-sm text-red-700">{state.fieldErrors.label[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fieldKey">Field key</Label>
            <Input id="fieldKey" name="fieldKey" placeholder="emergency_contact_name" />
            {state.fieldErrors?.fieldKey ? (
              <p className="text-sm text-red-700">{state.fieldErrors.fieldKey[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input defaultValue={0} id="sortOrder" min={0} name="sortOrder" type="number" />
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
            <input name="isRequired" type="checkbox" />
            Required field
          </label>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="options">Select options</Label>
            <Textarea
              id="options"
              name="options"
              placeholder={"One option per line\nOnly used for select fields"}
              rows={4}
            />
            {state.fieldErrors?.options ? (
              <p className="text-sm text-red-700">{state.fieldErrors.options[0]}</p>
            ) : null}
          </div>
          <div className="md:col-span-2">
            <FormMessage
              message={state.message}
              tone={state.status === "success" ? "success" : "error"}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <SubmitButton pendingLabel="Saving...">Add custom field</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
