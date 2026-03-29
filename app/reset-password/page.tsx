import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { getCurrentSession } from "@/lib/auth";

export default async function ResetPasswordPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(24,24,27,0.08),_transparent_40%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-stone-200 bg-white/90 p-8 shadow-sm lg:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
            Account security
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
            Update your password securely.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
            Use this page if you rely on the password fallback instead of Google sign-in and want to change your password.
          </p>
          <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
            After you update the password, CaseFlow will send you back to the right dashboard for your role automatically.
          </div>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
