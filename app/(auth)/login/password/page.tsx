import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PasswordLoginForm } from "@/components/forms/password-login-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth";
import { getOrganizationSettings, getSupportHref } from "@/lib/organization-settings";

type PasswordLoginPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
  }>;
};

export default async function PasswordLoginPage({
  searchParams,
}: PasswordLoginPageProps) {
  const [session, settings, params, t] = await Promise.all([
    getCurrentSession(),
    getOrganizationSettings(),
    searchParams,
    getTranslations("PasswordLoginPage"),
  ]);

  if (session) {
    redirect("/dashboard");
  }

  const errorMessage = params.error === "not-approved" ? t("errorNotApproved") : null;
  const supportHref = getSupportHref(settings);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="brand-card border shadow-sm">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-8 lg:p-10">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                {t("label")}
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-950">
                {t("headline")}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600">
                {settings.organization_name} can keep this fallback for approved users who cannot use Google OAuth. Everyone else should return to the main sign-in screen.
              </p>
            </div>

            {errorMessage ? (
              <div aria-live="assertive" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm leading-6 text-stone-600">
              {t("needHelp")}{" "}
              {supportHref ? (
                <Link className="font-medium text-stone-900 underline-offset-4 hover:underline" href={supportHref}>
                  {settings.support_cta_text}
                </Link>
              ) : (
                t("contactAdmin")
              )}
            </div>

            <Link className="text-sm font-medium text-stone-700 underline-offset-4 hover:underline" href="/login">
              {t("backToGoogle")}
            </Link>
          </CardContent>
        </Card>
        <PasswordLoginForm defaultEmail={params.email} />
      </div>
    </div>
  );
}
