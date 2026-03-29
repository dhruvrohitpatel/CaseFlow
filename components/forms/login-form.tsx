"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginFormProps = {
  defaultEmail?: string | undefined;
};

export function LoginForm({ defaultEmail }: LoginFormProps) {
  const passwordFallbackHref = defaultEmail
    ? `/login/password?email=${encodeURIComponent(defaultEmail)}`
    : "/login/password";

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use Google OAuth as the primary sign-in path. If your organization uses password login instead, open the fallback screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Link
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            href="/auth/google"
          >
            Continue with Google
            <ArrowRight className="size-4" />
          </Link>
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100"
            href={passwordFallbackHref}
          >
            Don&apos;t have Google email
          </Link>
          <p className="text-center text-xs leading-5 text-stone-500">
            Organizations can keep this screen minimal and use their own branding, logo, welcome copy, and support details here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
