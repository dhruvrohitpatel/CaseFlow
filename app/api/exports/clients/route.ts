import { getCurrentSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await getCurrentSession();

  if (!session || session.profile.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await session.supabase
    .from("clients")
    .select(
      "client_id, full_name, status, phone, email, date_of_birth, preferred_name, preferred_language, pronouns, housing_status, referral_source, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(toCsv(data ?? []), {
    headers: {
      "Content-Disposition": 'attachment; filename="caseflow-clients.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
