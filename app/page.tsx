import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Palette, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { getOrganizationSettings, getSupportHref } from "@/lib/organization-settings";

const primaryLinkClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors brand-primary-button";
const outlineLinkClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";

export default async function HomePage() {
  const [session, settings] = await Promise.all([
    getCurrentSession(),
    getOrganizationSettings(),
  ]);

  if (session) {
    redirect("/dashboard");
  }

  const supportHref = getSupportHref(settings);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-stone-200/80 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`${settings.organization_name} logo`}
                  className="h-11 w-11 rounded-2xl border border-stone-200 bg-white object-cover shadow-sm"
                  src={settings.logo_url}
                />
              </>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-[color:var(--brand-primary)] text-sm font-semibold text-[color:var(--brand-primary-foreground)] shadow-sm">
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
          <div className="flex flex-wrap gap-3">
            {supportHref ? (
              <Link className={outlineLinkClassName} href={supportHref}>
                {settings.support_cta_text}
              </Link>
            ) : null}
            <Link className={primaryLinkClassName} href="/login">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10">
          <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-8">
              <div className="space-y-5">
                <div className="inline-flex rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] brand-chip">
                  White-label nonprofit operations
                </div>
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-stone-950">
                  {settings.organization_name} can run case management, client portals, and operational reporting from one branded workspace.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-stone-600">
                  {settings.public_welcome_text}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className={primaryLinkClassName} href="/login">
                  Access your workspace
                  <ArrowRight className="size-4" />
                </Link>
                <Link className={outlineLinkClassName} href="#product-sections">
                  See how the platform works
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-3" id="product-sections">
                <div className="brand-card rounded-3xl border p-5">
                  <BriefcaseBusiness className="size-5 text-stone-700" />
                  <h2 className="mt-4 text-lg font-semibold text-stone-950">Operational hub</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Intake, appointments, service logs, dashboards, and approved access all live in the same product shell.
                  </p>
                </div>
                <div className="brand-card rounded-3xl border p-5">
                  <Palette className="size-5 text-stone-700" />
                  <h2 className="mt-4 text-lg font-semibold text-stone-950">Branded per nonprofit</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Each deployment can carry the nonprofit’s name, colors, logo, support contact, and portal copy without rebuilding the platform.
                  </p>
                </div>
                <div className="brand-card rounded-3xl border p-5">
                  <UsersRound className="size-5 text-stone-700" />
                  <h2 className="mt-4 text-lg font-semibold text-stone-950">Role-aware experience</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Admins, staff, and clients each land in the workspace they need without getting buried in controls meant for someone else.
                  </p>
                </div>
              </div>
            </section>

            <section className="brand-card rounded-[2rem] border p-8 lg:p-10">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                What ships with each deployment
              </p>
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-white/80 bg-white/88 p-5">
                  <h2 className="text-base font-semibold text-stone-950">Admin setup wizard</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Brand the workspace, configure support contact, review allowlist onboarding, and launch from one guided flow.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/88 p-5">
                  <h2 className="text-base font-semibold text-stone-950">Mission-control dashboard</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Track active clients, service activity, schedules, semantic note search, exports, and audit visibility from one admin surface.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/88 p-5">
                  <h2 className="text-base font-semibold text-stone-950">Secure invite-only access</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Google sign-in is preferred, approved password fallback remains available, and every portal user is routed by role after sign-in.
                  </p>
                </div>
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white/80 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-950">
                    <BadgeCheck className="size-4" />
                    Deploy-per-org model
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Each nonprofit gets its own deployment, branding layer, support materials, and onboarding checklist instead of sharing a noisy multi-tenant portal.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
