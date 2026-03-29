"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headset, LayoutTemplate } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import type { Database } from "@/lib/database.types";
import type { OrganizationSettings } from "@/lib/organization-settings";
import { getSupportHref } from "@/lib/organization-settings";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AppShellProps = {
  children: React.ReactNode;
  organizationSettings: OrganizationSettings;
  profile: Profile;
  setupComplete: boolean;
};

export function AppShell({
  children,
  organizationSettings,
  profile,
  setupComplete,
}: AppShellProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("AppShell");
  const locale = useLocale();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function getRoleLabel(role: Profile["role"]) {
    switch (role) {
      case "admin": return t("roleAdmin");
      case "staff": return t("roleStaff");
      case "client": return t("roleClient");
      default: return role;
    }
  }

  const navItems =
    profile.role === "client"
      ? [{ href: "/dashboard", label: t("navDashboard") }]
      : [
          { href: "/dashboard", label: t("navDashboard") },
          { href: "/clients", label: t("navClients") },
          { href: "/clients/new", label: t("navNewClient") },
          { href: "/services", label: t("navVoiceNotes") },
          { href: "/schedule", label: t("navSchedule") },
          ...(profile.role === "admin"
            ? [
                { href: "/admin", label: t("navAdmin") },
                { href: "/setup", label: setupComplete ? t("navSetup") : t("navSetupGuide") },
              ]
            : []),
        ];

  const supportHref = getSupportHref(organizationSettings);

  return (
    <div className="min-h-screen">
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-stone-200/80 bg-white/94 backdrop-blur-xl transition-all duration-200",
          scrolled ? "shadow-[0_8px_22px_rgba(28,25,23,0.06)]" : "",
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div
            className={cn(
              "grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center",
              scrolled ? "lg:gap-2" : "lg:gap-4",
            )}
          >
            <div className="flex items-center gap-3">
              {organizationSettings.logo_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`${organizationSettings.organization_name} logo`}
                    className="h-11 w-11 rounded-2xl border border-stone-200 bg-white object-cover shadow-sm"
                    src={organizationSettings.logo_url}
                  />
                </>
              ) : (
                <div
                  aria-label={organizationSettings.organization_name}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-[color:var(--brand-primary)] text-sm font-semibold text-[color:var(--brand-primary-foreground)] shadow-sm"
                  role="img"
                >
                  <span aria-hidden="true">{organizationSettings.organization_name.slice(0, 2).toUpperCase()}</span>
                </div>
              )}
              <div className="min-w-0">
                <Link
                  className="block truncate text-base font-semibold tracking-tight text-stone-950 sm:text-lg"
                  href="/dashboard"
                >
                  {organizationSettings.organization_name}
                </Link>
                <p className="hidden truncate text-sm text-stone-600 xl:block">
                  {profile.role === "client"
                    ? organizationSettings.login_welcome_text
                    : organizationSettings.product_subtitle}
                </p>
              </div>
            </div>

            <nav aria-label="Main navigation" className="flex flex-wrap justify-start gap-2 lg:justify-center">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "text-[color:var(--brand-primary-foreground)] shadow-sm"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200",
                    )}
                    href={item.href}
                    style={isActive ? { backgroundColor: "var(--brand-primary)" } : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              <LanguageSwitcher currentLocale={locale} />
              <Badge className="brand-chip border-0 capitalize">{getRoleLabel(profile.role)}</Badge>
              {supportHref ? (
                <Link
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
                  href={supportHref}
                >
                  <Headset aria-hidden="true" className="size-4" />
                  {organizationSettings.support_cta_text}
                </Link>
              ) : null}
              {profile.role === "admin" && !setupComplete ? (
                <Link
                  className="inline-flex h-7 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-medium text-stone-900 transition-colors hover:bg-white"
                  href="/setup"
                  style={{
                    backgroundColor: "rgb(var(--brand-accent-rgb) / 0.22)",
                    borderColor: "rgb(var(--brand-primary-rgb) / 0.12)",
                  }}
                >
                  <LayoutTemplate aria-hidden="true" className="size-4" />
                  {t("finishSetup")}
                </Link>
              ) : null}
              <div className="min-w-0 text-right text-sm text-stone-600">
                <div className="truncate font-medium text-stone-950">
                  {profile.full_name ?? profile.email}
                </div>
                <div className="hidden truncate text-xs text-stone-500 xl:block">{profile.email}</div>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8" id="main-content">
        {children}
      </main>
    </div>
  );
}
