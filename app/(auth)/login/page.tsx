import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/forms/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth";
import { getOrganizationSettings, getSupportHref } from "@/lib/organization-settings";

type LoginPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, settings, params, t] = await Promise.all([
    getCurrentSession(),
    getOrganizationSettings(),
    searchParams,
    getTranslations("LoginPage"),
  ]);

  if (session) {
    redirect("/dashboard");
  }

  function resolveError(error?: string) {
    switch (error) {
      case "not-approved": return t("errorNotApproved");
      case "oauth": return t("errorOauth");
      case "portal-missing": return t("errorPortalMissing");
      default: return null;
    }
  }

  const errorMessage = resolveError(params.error);
  const supportHref = getSupportHref(settings);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="brand-card border shadow-sm">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-8 lg:p-10">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                {settings.logo_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`${settings.organization_name} logo`}
                      className="h-14 w-14 rounded-3xl border border-white/80 bg-white object-cover shadow-sm"
                      src={settings.logo_url}
                    />
                  </>
                ) : (
                  <div
                    aria-label={settings.organization_name}
                    className="flex h-14 w-14 items-center justify-center rounded-3xl text-sm font-semibold text-[color:var(--brand-primary-foreground)] shadow-sm"
                    role="img"
                    style={{ backgroundColor: "var(--brand-primary)" }}
                  >
                    <span aria-hidden="true">{settings.organization_name.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                    {settings.organization_name}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">{settings.product_subtitle}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-950">
                  Branded case management access for staff and invite-only client portals.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-stone-600">
                  {settings.login_welcome_text}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/80 bg-white/88 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                  {t("staffLabel")}
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {t("staffDesc")}
                </p>
              </div>
              <div className="rounded-3xl border border-white/80 bg-white/88 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                  {t("clientsLabel")}
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {t("clientsDesc")}
                </p>
              </div>
            </div>

            {errorMessage ? (
              <div aria-live="assertive" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm leading-6 text-stone-600">
              {t("needAccess")}
              {supportHref ? (
                <>
                  {" "}
                  <Link className="font-medium text-stone-900 underline-offset-4 hover:underline" href={supportHref}>
                    {settings.support_cta_text}
                  </Link>
                </>
              ) : null}
            </div>

            <Link className="text-sm font-medium text-stone-700 underline-offset-4 hover:underline" href="/">
              {t("backToOverview")}
            </Link>
          </CardContent>
        </Card>
        <LoginForm defaultEmail={params.email} organizationName={settings.organization_name} />
      </div>
    </div>
  );
}
