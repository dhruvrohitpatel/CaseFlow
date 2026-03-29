import { redirect } from "next/navigation";

import { getDashboardPathForRole, requireAppSession } from "@/lib/auth";

export default async function DashboardRouterPage() {
  const { profile } = await requireAppSession();

  redirect(getDashboardPathForRole(profile.role));
}
