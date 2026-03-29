import { getCurrentSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await getCurrentSession();

  if (!session || session.profile.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await session.supabase
    .from("service_entries")
    .select(
      "service_date, staff_member_name, notes, clients!service_entries_client_id_fkey(client_id, full_name), service_types(name)",
    )
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows =
    data?.map((entry) => ({
      client_name:
        Array.isArray(entry.clients) && entry.clients.length > 0
          ? entry.clients[0]?.full_name ?? ""
          : (entry.clients as { client_id?: string; full_name?: string } | null)?.full_name ?? "",
      client_public_id:
        Array.isArray(entry.clients) && entry.clients.length > 0
          ? entry.clients[0]?.client_id ?? ""
          : (entry.clients as { client_id?: string; full_name?: string } | null)?.client_id ?? "",
      notes: entry.notes,
      service_date: entry.service_date,
      service_type:
        Array.isArray(entry.service_types) && entry.service_types.length > 0
          ? entry.service_types[0]?.name ?? ""
          : (entry.service_types as { name?: string } | null)?.name ?? "",
      staff_member_name: entry.staff_member_name,
    })) ?? [];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Disposition": 'attachment; filename="caseflow-service-logs.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
