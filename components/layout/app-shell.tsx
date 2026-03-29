"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headset } from "lucide-react";
import { useEffect, useState } from "react";

import type { Database } from "@/lib/database.types";
import type { OrganizationSettings } from "@/lib/organization-settings";
import { getSupportHref } from "@/lib/organization-settings";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/layout/sign-out-button";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AppShellProps = {
  children: React.ReactNode;
  organizationSettings: OrganizationSettings;
  profile: Profile;
  setupComplete: boolean;
};

function getRoleLabel(role: Profile["role"]) {
  switch (role) {
    case "admin":
      return "Administrator";
    case "staff":
      return "Staff workspace";
    case "client":
      return "Client portal";
    default:
      return role;
  }
}

export function AppShell({
  children,
  organizationSettings,
  profile,
  setupComplete,
}: AppShellProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems =
    profile.role === "client"
      ? [{ href: "/dashboard", label: "Dashboard" }]
      : [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/clients", label: "Clients" },
          { href: "/clients/new", label: "New client" },
          { href: "/services", label: "Voice notes" },
          { href: "/schedule", label: "Schedule" },
          ...(profile.role === "admin"
            ? [
                { href: "/admin", label: "Admin" },
                { href: "/setup", label: setupComplete ? "Setup" : "Setup guide" },
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
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-[color:var(--brand-primary)] text-sm font-semibold text-[color:var(--brand-primary-foreground)] shadow-sm">
                  {organizationSettings.organization_name.slice(0, 2).toUpperCase()}
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

            <nav className="flex flex-wrap justify-start gap-2 lg:justify-center">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                const isSetupItem = item.href === "/setup";
                const navClassName = cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-[color:var(--brand-primary-foreground)] shadow-sm"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200",
                );

                if (isSetupItem && isActive) {
                  return (
                    <span
                      key={item.href}
                      className={navClassName}
                      style={{ backgroundColor: "var(--brand-primary)" }}
                    >
                      {item.label}
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    className={navClassName}
                    href={item.href}
                    prefetch={isSetupItem ? false : undefined}
                    style={isActive ? { backgroundColor: "var(--brand-primary)" } : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
              <Badge className="brand-chip border-0 capitalize">{getRoleLabel(profile.role)}</Badge>
              {supportHref ? (
                <Link
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
                  href={supportHref}
                >
                  <Headset className="size-4" />
                  {organizationSettings.support_cta_text}
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
