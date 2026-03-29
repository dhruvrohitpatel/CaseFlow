import { NextResponse, type NextRequest } from "next/server";

import { AccessNotApprovedError, syncUserAccessFromAllowlist } from "@/lib/access-allowlist";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const appUrl = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const nextPath = next?.startsWith("/") ? next : "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          await syncUserAccessFromAllowlist(user);
          return NextResponse.redirect(`${appUrl}${nextPath}`);
        } catch (syncError) {
          if (syncError instanceof AccessNotApprovedError) {
            await supabase.auth.signOut();
            return NextResponse.redirect(`${appUrl}/login?error=not-approved`);
          }

          throw syncError;
        }
      }
    }
  }

  return NextResponse.redirect(`${appUrl}/login?error=oauth`);
}
