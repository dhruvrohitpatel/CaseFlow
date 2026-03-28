import { NextResponse } from "next/server";

import { getClientEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const clientEnv = getClientEnv();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
    provider: "google",
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      `${clientEnv.NEXT_PUBLIC_APP_URL}/login?error=google-config`,
    );
  }

  return NextResponse.redirect(data.url);
}
