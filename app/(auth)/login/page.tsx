import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/forms/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth";

function resolveError(error?: string) {
  switch (error) {
    case "not-approved":
      return "That email is not approved for CaseFlow access. Ask your admin to add it to the allowlist.";
    case "oauth":
      return "Sign-in could not complete. Try again or contact your admin.";
    case "portal-missing":
      return "Your portal access is not fully configured yet. Contact your organization for help.";
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
                CaseFlow access
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-950">
                Secure access for nonprofit teams and client portals.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600">
                CaseFlow is built so nonprofit teams can run client case management and brand the experience as their own website. This entry point stays intentionally simple.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                  Branding marker
                </p>
                <p className="mt-3 text-sm font-semibold text-stone-950">[ Nonprofit logo ]</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Place the organization logo, name, and primary color treatment here.
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                  Branding marker
                </p>
                <p className="mt-3 text-sm font-semibold text-stone-950">[ Welcome message / support contact ]</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  This is where each nonprofit can add custom welcome copy, support instructions, and a help email or phone number.
                </p>
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
              Need access? Contact your organization’s admin to add your email and assign your role before you sign in.
            </div>

            <Link className="text-sm font-medium text-stone-700 underline-offset-4 hover:underline" href="/">
              Back to overview
            </Link>
          </CardContent>
        </Card>
        <LoginForm defaultEmail={params.email} />
      </div>
    </div>
  );
}
