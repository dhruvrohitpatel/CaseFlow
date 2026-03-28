import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardList, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentSession, requireRole } from "@/lib/auth";

const primaryLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800";
const outlineLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";

async function AdminSetupCard() {
  await requireRole(["admin"]);

  return (
    <Card className="border-stone-200 bg-stone-950 text-stone-50 shadow-sm">
      <CardHeader>
        <CardTitle>Admin setup notes</CardTitle>
        <CardDescription className="text-stone-300">
          Keep deployment and team access stable before demo day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-stone-200">
        <p>1. Promote one seeded or signed-up user to the <strong>admin</strong> role in Supabase.</p>
        <p>2. Add the public and service-role env vars in Vercel before the first production deploy.</p>
        <p>3. Enable Google auth in Supabase only if you want OAuth in the demo. Email/password already works.</p>
      </CardContent>
    </Card>
  );
}

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { profile, supabase } = await requireCurrentSession();
  const [{ count: clientCount }, { count: serviceCount }, params] =
    await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("service_entries").select("*", { count: "exact", head: true }),
      searchParams,
    ]);

  return (
    <div className="space-y-6">
      {params.error === "unauthorized" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That action is only available to admin users.
        </div>
      ) : null}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back, {profile.full_name ?? "team member"}.</CardTitle>
            <CardDescription>
              This MVP covers authentication, client intake, client search, profile views, service
              logging, schema readiness, seed data, README guidance, and deployment preparation.
              P1 and P2 features are intentionally not built in this pass.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
                <Users className="size-4" />
                Clients in system
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {clientCount ?? 0}
              </div>
              <p className="mt-2 text-sm text-stone-600">Searchable from the client directory.</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
                <ClipboardList className="size-4" />
                Services logged
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {serviceCount ?? 0}
              </div>
              <p className="mt-2 text-sm text-stone-600">Displayed reverse chronologically on each client profile.</p>
            </div>
          </CardContent>
        </Card>
        {profile.role === "admin" ? <AdminSetupCard /> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Register a new client</CardTitle>
            <CardDescription>
              Start a record with demographics and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={primaryLinkClassName} href="/clients/new">
              Open intake form
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Browse clients</CardTitle>
            <CardDescription>
              Search by name and jump into each client profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link className={outlineLinkClassName} href="/clients">
              Go to clients
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Need setup help?</CardTitle>
            <CardDescription>
              The README covers Supabase SQL, seed data, env vars, and Vercel deployment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-start gap-3 text-sm text-stone-600">
            <AlertTriangle className="mt-0.5 size-4 text-stone-500" />
            Use the exact commands in the README to keep the demo environment repeatable.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
