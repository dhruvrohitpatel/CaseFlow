import { redirect } from "next/navigation";

import { LoginForm } from "@/components/forms/login-form";
import { SignUpForm } from "@/components/forms/signup-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth";

function resolveMessage(message?: string) {
  switch (message) {
    case "confirm-email":
      return "Account created. If email confirmation is enabled in Supabase, confirm the email before signing in.";
    default:
      return null;
  }
}

function resolveError(error?: string) {
  switch (error) {
    case "google-config":
      return "Google auth is scaffolded, but the provider still needs to be enabled in Supabase.";
    case "oauth":
      return "Google sign-in could not complete. Check your Supabase auth provider settings.";
    default:
      return null;
  }
}

type LoginPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = resolveError(params.error);
  const infoMessage = resolveMessage(params.message);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.08),_transparent_40%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)] px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-stone-200 bg-white/90 shadow-sm">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-8 lg:p-10">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                CaseFlow P0 MVP
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-950">
                Auth, client intake, and service tracking for a stable nonprofit demo.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600">
                This pass includes email/password auth, staff and admin roles, client registration,
                client search, profile views, service logging, schema and seed data, and deployment
                readiness. P1 and P2 features are intentionally out of scope.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-900">What staff can do</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Sign in, register clients, search records, view demographics, and log services.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-900">What admins can do</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Review setup guidance, own deployment steps, and manage environment configuration.
                </p>
              </div>
            </div>
            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {infoMessage ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {infoMessage}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <div className="grid gap-6">
          <LoginForm defaultEmail={params.email} />
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
