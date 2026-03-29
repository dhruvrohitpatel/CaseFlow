"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction } from "@/app/actions/auth";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/form-state";

type PasswordLoginFormProps = {
  defaultEmail?: string;
};

export function PasswordLoginForm({ defaultEmail }: PasswordLoginFormProps) {
  const [state, formAction] = useActionState(signInAction, initialActionState);

  return (
    <Card className="brand-card border shadow-sm">
      <CardHeader>
        <CardTitle>Password login</CardTitle>
        <CardDescription>
          This is the fallback path for approved emails that do not use Google OAuth.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input defaultValue={defaultEmail} id="login-email" name="email" placeholder="staff@caseflow.demo" type="email" />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-red-700">{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" name="password" placeholder="Enter your password" type="password" />
            {state.fieldErrors?.password ? (
              <p className="text-sm text-red-700">{state.fieldErrors.password[0]}</p>
            ) : null}
          </div>
          <FormMessage message={state.message} />
          <div className="flex flex-col gap-3">
            <SubmitButton pendingLabel="Signing in...">Sign in with password</SubmitButton>
            <Link className="text-center text-sm font-medium text-stone-700 underline-offset-4 hover:underline" href="/login">
              Back to Google sign-in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
