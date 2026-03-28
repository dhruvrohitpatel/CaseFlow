"use client";

import { useActionState, useState } from "react";

import { createAppointmentAction } from "@/app/actions/appointments";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions/form-state";

type AppointmentClientOption = {
  id: string;
  label: string;
};

type CreateAppointmentFormProps = {
  clients: AppointmentClientOption[];
};

const nativeSelectClassName =
  "flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

export function CreateAppointmentForm({
  clients,
}: CreateAppointmentFormProps) {
  const [state, formAction] = useActionState(createAppointmentAction, initialActionState);
  const [defaultScheduledFor] = useState(() =>
    new Date(Date.now() + 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
  );

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Schedule an appointment</CardTitle>
        <CardDescription>
          Keep today and this week visible without turning scheduling into a heavy workflow.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="clientId">Client</Label>
            <select className={nativeSelectClassName} id="clientId" name="clientId">
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.clientId ? (
              <p className="text-sm text-red-700">{state.fieldErrors.clientId[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledFor">Date and time</Label>
            <Input
              defaultValue={defaultScheduledFor}
              id="scheduledFor"
              name="scheduledFor"
              type="datetime-local"
            />
            {state.fieldErrors?.scheduledFor ? (
              <p className="text-sm text-red-700">{state.fieldErrors.scheduledFor[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duration (minutes)</Label>
            <Input defaultValue={30} id="durationMinutes" min={15} name="durationMinutes" step={15} type="number" />
            {state.fieldErrors?.durationMinutes ? (
              <p className="text-sm text-red-700">{state.fieldErrors.durationMinutes[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Front desk, phone, or Zoom" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminderStatus">Reminder status</Label>
            <select className={nativeSelectClassName} defaultValue="pending" id="reminderStatus" name="reminderStatus">
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="not_needed">Not needed</option>
            </select>
            {state.fieldErrors?.reminderStatus ? (
              <p className="text-sm text-red-700">{state.fieldErrors.reminderStatus[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Add context, prep steps, or contact notes." rows={4} />
          </div>
          <div className="md:col-span-2">
            <FormMessage
              message={state.message}
              tone={state.status === "success" ? "success" : "error"}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <SubmitButton pendingLabel="Scheduling...">Create appointment</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
