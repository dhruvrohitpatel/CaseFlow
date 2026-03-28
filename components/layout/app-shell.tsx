"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Database } from "@/lib/database.types";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/layout/sign-out-button";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AppShellProps = {
  children: React.ReactNode;
  profile: Profile;
};

export function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/clients", label: "Clients" },
    { href: "/clients/new", label: "New client" },
    { href: "/schedule", label: "Schedule" },
    ...(profile.role === "admin"
      ? [{ href: "/admin", label: "Admin" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link className="text-lg font-semibold tracking-tight text-stone-950" href="/dashboard">
                CaseFlow
              </Link>
              <p className="text-sm text-stone-600">
                Low-friction client and service tracking for nonprofit staff.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Badge className="capitalize" variant="secondary">
                {profile.role}
              </Badge>
              <div className="text-sm text-stone-600">
                {profile.full_name ?? profile.email}
              </div>
              <SignOutButton />
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200",
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
