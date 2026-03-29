"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("PasswordLoginForm");
  const [state, formAction] = useActionState(signInAction, initialActionState);

  return (
    <Card className="brand-card border shadow-sm">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">{t("emailLabel")}</Label>
            <Input
              aria-describedby={state.fieldErrors?.email ? "login-email-error" : undefined}
              aria-invalid={!!state.fieldErrors?.email}
              defaultValue={defaultEmail}
              id="login-email"
              name="email"
              placeholder="staff@caseflow.demo"
              type="email"
            />
            {state.fieldErrors?.email ? (
              <p aria-live="assertive" className="text-sm text-red-700" id="login-email-error" role="alert">
                {state.fieldErrors.email[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">{t("passwordLabel")}</Label>
            <Input
              aria-describedby={state.fieldErrors?.password ? "login-password-error" : undefined}
              aria-invalid={!!state.fieldErrors?.password}
              id="login-password"
              name="password"
              placeholder="Enter your password"
              type="password"
            />
            {state.fieldErrors?.password ? (
              <p aria-live="assertive" className="text-sm text-red-700" id="login-password-error" role="alert">
                {state.fieldErrors.password[0]}
              </p>
            ) : null}
          </div>
          <FormMessage message={state.message} />
          <div className="flex flex-col gap-3">
            <SubmitButton pendingLabel={t("signingIn")}>{t("submit")}</SubmitButton>
            <Link className="text-center text-sm font-medium text-stone-700 underline-offset-4 hover:underline" href="/login">
              {t("backToGoogle")}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
