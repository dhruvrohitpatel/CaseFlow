import Link from "next/link";
import { redirect } from "next/navigation";

import { PasswordLoginForm } from "@/components/forms/password-login-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth";

type PasswordLoginPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
  }>;
};

function resolveError(error?: string) {
  switch (error) {
    case "not-approved":
      return "That email is not approved for CaseFlow access. Ask your admin to add it to the allowlist.";
    default:
      return null;
  }
}

export default async function PasswordLoginPage({
  searchParams,
}: PasswordLoginPageProps) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = resolveError(params.error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.08),_transparent_40%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)] px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-stone-200 bg-white/90 shadow-sm">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-8 lg:p-10">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                Password fallback
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-950">
                Use password login only when Google is not available.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600">
                This fallback is for approved users whose organization supports email and password access.
              </p>
            </div>

            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
              If Google is available for your organization, go back and use that path instead.
            </div>

            <Link className="text-sm font-medium text-stone-700 underline-offset-4 hover:underline" href="/login">
              Back to main login
            </Link>
          </CardContent>
        </Card>
        <PasswordLoginForm defaultEmail={params.email} />
      </div>
    </div>
  );
}
