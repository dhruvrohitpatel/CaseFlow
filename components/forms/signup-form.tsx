"use client";

import { useActionState } from "react";

import { signUpAction } from "@/app/actions/auth";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/form-state";

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialActionState);

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Create a staff account</CardTitle>
        <CardDescription>
          Default signups are created as staff. Promote one account to admin in Supabase for team setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full name</Label>
            <Input id="signup-name" name="fullName" placeholder="Jamie Rivera" />
            {state.fieldErrors?.fullName ? (
              <p className="text-sm text-red-700">{state.fieldErrors.fullName[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" name="email" placeholder="jamie@nonprofit.org" type="email" />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-red-700">{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input id="signup-password" name="password" placeholder="At least 8 characters" type="password" />
            {state.fieldErrors?.password ? (
              <p className="text-sm text-red-700">{state.fieldErrors.password[0]}</p>
            ) : null}
          </div>
          <FormMessage message={state.message} />
          <SubmitButton pendingLabel="Creating account...">Create account</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
