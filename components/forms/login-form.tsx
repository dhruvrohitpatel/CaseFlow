"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginFormProps = {
  defaultEmail?: string | undefined;
  organizationName: string;
};

export function LoginForm({ defaultEmail, organizationName }: LoginFormProps) {
  const t = useTranslations("LoginForm");

  const passwordFallbackHref = defaultEmail
    ? `/login/password?email=${encodeURIComponent(defaultEmail)}`
    : "/login/password";

  return (
    <Card className="brand-card border shadow-sm">
      <CardHeader>
        <CardTitle>{t("title", { orgName: organizationName })}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Link
            className="brand-primary-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors"
            href="/auth/google"
            role="button"
          >
            {t("continueWithGoogle")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
            href={passwordFallbackHref}
            role="button"
          >
            {t("passwordFallback")}
          </Link>
          <p className="text-center text-xs leading-5 text-stone-500">
            {t("footerNote")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
