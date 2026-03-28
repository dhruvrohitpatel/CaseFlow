"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction } from "@/app/actions/auth";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/form-state";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  defaultEmail?: string;
};

export function LoginForm({ defaultEmail }: LoginFormProps) {
  const [state, formAction] = useActionState(signInAction, initialActionState);

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your nonprofit staff account to access the case management app.
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
            <SubmitButton pendingLabel="Signing in...">Sign in</SubmitButton>
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "justify-center")}
              href="/auth/google"
            >
              Continue with Google
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
