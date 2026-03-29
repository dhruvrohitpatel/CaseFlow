"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "@/app/actions/auth";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/form-state";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(
    resetPasswordAction,
    initialActionState,
  );

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>
          Your admin created a temporary password. Choose a new one before continuing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input id="reset-password" name="password" placeholder="Create a strong password" type="password" />
            {state.fieldErrors?.password ? (
              <p className="text-sm text-red-700">{state.fieldErrors.password[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password">Confirm new password</Label>
            <Input id="reset-confirm-password" name="confirmPassword" placeholder="Re-enter your new password" type="password" />
            {state.fieldErrors?.confirmPassword ? (
              <p className="text-sm text-red-700">{state.fieldErrors.confirmPassword[0]}</p>
            ) : null}
          </div>
          <FormMessage message={state.message} />
          <SubmitButton pendingLabel="Updating password...">Update password</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
