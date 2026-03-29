import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";

const primaryLinkClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-800";
const outlineLinkClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.08),_transparent_40%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
              CaseFlow
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Calm case management for nonprofit teams and clients.
            </p>
          </div>
          <Link className={outlineLinkClassName} href="/login">
            Sign in
          </Link>
        </header>

        <main className="flex flex-1 items-center py-10">
          <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-8">
              <div className="space-y-5">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                  Built for nonprofit operations
                </p>
                <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-stone-950">
                  One place for client care, staff coordination, and accountable admin oversight.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-stone-600">
                  CaseFlow gives teams a low-friction way to manage client intake, service delivery,
                  scheduling, reporting, and secure role-based access without overwhelming staff or clients.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className={primaryLinkClassName} href="/login">
                  Access your portal
                  <ArrowRight className="size-4" />
                </Link>
                <Link className={outlineLinkClassName} href="#personas">
                  See how each role uses it
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-3" id="personas">
                <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
                  <ShieldCheck className="size-5 text-stone-700" />
                  <h2 className="mt-4 text-lg font-semibold text-stone-950">Admins</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Manage approved emails, monitor reporting, review audits, and keep the system secure.
                  </p>
                </div>
                <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
                  <Users className="size-5 text-stone-700" />
                  <h2 className="mt-4 text-lg font-semibold text-stone-950">Staff</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Register clients, log services, review schedules, and work from a focused operational dashboard.
                  </p>
                </div>
                <div className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
                  <CalendarDays className="size-5 text-stone-700" />
                  <h2 className="mt-4 text-lg font-semibold text-stone-950">Clients</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Check current status, upcoming appointments, and recent activity from an invite-only portal.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-8 shadow-sm lg:p-10">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                Why this matters
              </p>
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl bg-stone-50 p-5">
                  <h2 className="text-base font-semibold text-stone-950">Lower cognitive load</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Staff see the tasks that matter to them, clients see only their own read-only updates, and admins retain control over access.
                  </p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-5">
                  <h2 className="text-base font-semibold text-stone-950">Built for accountability</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Reporting, audit trails, and least-privilege access support teams that need clear operational visibility without exposing sensitive notes.
                  </p>
                </div>
                <div className="rounded-2xl bg-stone-50 p-5">
                  <h2 className="text-base font-semibold text-stone-950">Invite-only access</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Organizations approve emails first. Google is the preferred login path, with approved password fallback when needed.
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
