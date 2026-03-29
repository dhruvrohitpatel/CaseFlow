"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginFormProps = {
  defaultEmail?: string | undefined;
  organizationName: string;
};

export function LoginForm({ defaultEmail, organizationName }: LoginFormProps) {
  const passwordFallbackHref = defaultEmail
    ? `/login/password?email=${encodeURIComponent(defaultEmail)}`
    : "/login/password";

  return (
    <Card className="brand-card border shadow-sm">
      <CardHeader>
        <CardTitle>Sign in to {organizationName}</CardTitle>
        <CardDescription>
          Google is the primary sign-in path. Use the fallback screen only if your organization approved password access for the same email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Link
            className="brand-primary-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors"
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
            This portal is configured by the organization, so the login experience can be white-labeled without changing the underlying CaseFlow platform.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
