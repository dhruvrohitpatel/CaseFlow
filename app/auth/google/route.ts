import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const appUrl = getAppUrl();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: `${appUrl}/auth/callback`,
    },
    provider: "google",
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${appUrl}/login?error=google-config`);
  }

  return NextResponse.redirect(data.url);
}
