import { NextResponse, type NextRequest } from "next/server";

import { getAppUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();
  const requestUrl = new URL(request.url);
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
