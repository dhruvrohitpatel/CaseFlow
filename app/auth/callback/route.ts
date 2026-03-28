import { NextResponse, type NextRequest } from "next/server";

import { clientEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${clientEnv.NEXT_PUBLIC_APP_URL}${next}`);
    }
  }

  return NextResponse.redirect(`${clientEnv.NEXT_PUBLIC_APP_URL}/login?error=oauth`);
}
