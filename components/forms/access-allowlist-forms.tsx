"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";

import { createAllowlistEntryAction } from "@/app/actions/admin";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/form-state";

type ClientOption = {
  id: string;
  label: string;
};

const nativeSelectClassName =
  "flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";
const textAreaClassName =
  "min-h-24 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

function AccessSuccessNotice({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      role="status"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-950">Approved access saved</p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}

export function ApproveTeamAccessForm() {
  const [state, formAction] = useActionState(
    createAllowlistEntryAction,
    initialActionState,
  );

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Approve team access</CardTitle>
        <CardDescription>
          Add an approved admin or staff email. Google is preferred, but the same email can also use password fallback.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-role">Role</Label>
            <select className={nativeSelectClassName} defaultValue="staff" id="team-role" name="role">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            {state.fieldErrors?.role ? (
              <p className="text-sm text-red-700">{state.fieldErrors.role[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-email">Approved email</Label>
            <Input id="team-email" name="email" placeholder="jamie@nonprofit.org" type="email" />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-red-700">{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-notes">Notes</Label>
            <textarea
              className={textAreaClassName}
              id="team-notes"
              name="notes"
              placeholder="Optional context, team, or onboarding notes"
            />
            {state.fieldErrors?.notes ? (
              <p className="text-sm text-red-700">{state.fieldErrors.notes[0]}</p>
            ) : null}
          </div>
          {state.status === "success" ? (
            <AccessSuccessNotice message={state.message} />
          ) : (
            <FormMessage message={state.message} />
          )}
          <SubmitButton pendingLabel="Saving access...">Save approved access</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

type ApproveClientAccessFormProps = {
  clients: ClientOption[];
};

export function ApproveClientAccessForm({
  clients,
}: ApproveClientAccessFormProps) {
  const [state, formAction] = useActionState(
    createAllowlistEntryAction,
    initialActionState,
  );

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Approve client portal access</CardTitle>
        <CardDescription>
          Link one approved client email to one client record. The dashboard remains read-only and does not expose internal notes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input name="role" type="hidden" value="client" />
          <div className="space-y-2">
            <Label htmlFor="clientRecordId">Client record</Label>
            <select className={nativeSelectClassName} defaultValue="" id="clientRecordId" name="linkedClientId">
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.linkedClientId ? (
              <p className="text-sm text-red-700">{state.fieldErrors.linkedClientId[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">Approved email</Label>
            <Input id="client-email" name="email" placeholder="client@example.org" type="email" />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-red-700">{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-notes">Notes</Label>
            <textarea
              className={textAreaClassName}
              id="client-notes"
              name="notes"
              placeholder="Optional outreach or portal-access notes"
            />
            {state.fieldErrors?.notes ? (
              <p className="text-sm text-red-700">{state.fieldErrors.notes[0]}</p>
            ) : null}
          </div>
          {state.status === "success" ? (
            <AccessSuccessNotice message={state.message} />
          ) : (
            <FormMessage message={state.message} />
          )}
          <SubmitButton pendingLabel="Saving access...">Save client access</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
