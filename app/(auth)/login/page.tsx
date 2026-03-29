import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/forms/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth";
import { getOrganizationSettings, getSupportHref } from "@/lib/organization-settings";

function resolveError(error?: string) {
  switch (error) {
    case "not-approved":
      return "That email is not approved for workspace access yet. Ask your organization admin to add it first.";
    case "oauth":
      return "Google sign-in could not complete. Try again or use the password fallback if your organization supports it.";
    case "portal-missing":
      return "Your client portal access is not fully configured yet. Contact your organization for help.";
    default:
      return null;
  }
}

type LoginPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, settings, params] = await Promise.all([
    getCurrentSession(),
    getOrganizationSettings(),
    searchParams,
  ]);

  if (session) {
    redirect("/dashboard");
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl text-sm font-semibold text-[color:var(--brand-primary-foreground)] shadow-sm" style={{ backgroundColor: "var(--brand-primary)" }}>
                    {settings.organization_name.slice(0, 2).toUpperCase()}
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
                  Staff and admins
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Use the same workspace for intake, appointments, reporting, semantic note search, and operational controls.
                </p>
              </div>
              <div className="rounded-3xl border border-white/80 bg-white/88 p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                  Clients
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Invite-only portal access stays read-only and keeps internal notes hidden while surfacing upcoming appointments and recent activity.
                </p>
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm leading-6 text-stone-600">
              Need access? Ask your organization admin to add your email and assign your role before you sign in.
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
              Back to overview
            </Link>
          </CardContent>
        </Card>
        <LoginForm defaultEmail={params.email} organizationName={settings.organization_name} />
      </div>
    </div>
  );
}
