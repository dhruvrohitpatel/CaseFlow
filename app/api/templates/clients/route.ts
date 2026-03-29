import { getClientCsvTemplate } from "@/lib/csv";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentSession();

  if (!session || session.profile.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(getClientCsvTemplate(), {
    headers: {
      "Content-Disposition": 'attachment; filename="caseflow-client-template.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
