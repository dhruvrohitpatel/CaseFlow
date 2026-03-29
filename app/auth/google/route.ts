import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const appUrl = requestUrl.origin;
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (
    requestUrl.hostname === "localhost" &&
    configuredAppUrl &&
    !configuredAppUrl.includes("localhost")
  ) {
    console.warn(
      `[CaseFlow auth] Local OAuth started on ${appUrl}, but NEXT_PUBLIC_APP_URL is set to ${configuredAppUrl}. Keep Supabase redirect URLs and local env aligned with http://localhost:3000/auth/callback.`,
    );
  }

  const next = requestUrl.searchParams.get("next");
  const nextPath = next?.startsWith("/") ? next : "/dashboard";
  const callbackUrl = new URL("/auth/callback", appUrl);
  callbackUrl.searchParams.set("next", nextPath);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      queryParams: {
        prompt: "select_account",
      },
      redirectTo: callbackUrl.toString(),
    },
    provider: "google",
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${appUrl}/login?error=oauth`);
  }

  return NextResponse.redirect(data.url);
}
