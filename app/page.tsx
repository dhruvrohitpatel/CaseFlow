import Link from "next/link";
import { ArrowRight, ArrowDown, BadgeCheck, BriefcaseBusiness, Palette, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getLocale } from "next-intl/server";

import { getCurrentSession } from "@/lib/auth";
import { getOrganizationSettings, getSupportHref } from "@/lib/organization-settings";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

const primaryLinkClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition-colors brand-primary-button shadow-sm";
const outlineLinkClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";

export default async function HomePage() {
  const [session, settings, t, locale] = await Promise.all([
    getCurrentSession(),
    getOrganizationSettings(),
    getTranslations("HomePage"),
    getLocale(),
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
              <div
                aria-label={settings.organization_name}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-[color:var(--brand-primary)] text-sm font-semibold text-[color:var(--brand-primary-foreground)] shadow-sm"
                role="img"
              >
                <span aria-hidden="true">{settings.organization_name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-stone-900">
                {settings.organization_name}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">{settings.product_subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            {supportHref ? (
              <Link className={outlineLinkClassName} href={supportHref}>
                {settings.support_cta_text}
              </Link>
            ) : null}
            <Link className={primaryLinkClassName} href="/login">
              {t("signIn")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10" id="main-content">
          <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-8">
              <div className="space-y-5">
                <div className="inline-flex rounded-full px-3 py-1.5 text-xs font-medium brand-chip">
                  {t("chip", { orgName: settings.organization_name })}
                </div>
                <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-stone-950">
                  {t("headline")}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-stone-600">
                  {settings.public_welcome_text}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className={outlineLinkClassName} href="#product-sections">
                  {t("seeHowItWorks")}
                  <ArrowDown aria-hidden="true" className="size-4" />
                </Link>
              </div>

              <div aria-label="Platform features" className="grid gap-4 md:grid-cols-3" id="product-sections">
                <div className="brand-card rounded-3xl border p-5">
                  <BriefcaseBusiness aria-hidden="true" className="size-5 text-stone-700" />
                  <h2 className="mt-4 text-base font-semibold text-stone-950">{t("staffToolsTitle")}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {t("staffToolsDesc")}
                  </p>
                </div>
                <div className="brand-card rounded-3xl border p-5">
                  <Palette aria-hidden="true" className="size-5 text-stone-700" />
                  <h2 className="mt-4 text-base font-semibold text-stone-950">{t("brandedTitle")}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {t("brandedDesc")}
                  </p>
                </div>
                <div className="brand-card rounded-3xl border p-5">
                  <UsersRound aria-hidden="true" className="size-5 text-stone-700" />
                  <h2 className="mt-4 text-base font-semibold text-stone-950">{t("roleAccessTitle")}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {t("roleAccessDesc")}
                  </p>
                </div>
              </div>
            </section>

            <section className="brand-card rounded-[2rem] border p-8 lg:p-10">
              <p className="text-sm font-semibold text-stone-700">
                {t("whatsIncluded")}
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/80 bg-white/88 p-5">
                  <h2 className="text-base font-semibold text-stone-950">{t("onboardingTitle")}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {t("onboardingDesc")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/88 p-5">
                  <h2 className="text-base font-semibold text-stone-950">{t("dashboardTitle")}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {t("dashboardDesc")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/88 p-5">
                  <h2 className="text-base font-semibold text-stone-950">{t("secureTitle")}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {t("secureDesc")}
                  </p>
                </div>
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white/80 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-950">
                    <BadgeCheck aria-hidden="true" className="size-4" />
                    {t("privateTitle")}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {t("privateDesc")}
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
