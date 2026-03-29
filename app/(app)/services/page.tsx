import { VoiceServiceEntry } from "@/components/voice/VoiceServiceEntry";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth";

export default async function ServicesPage() {
  const { supabase } = await requireRole(["admin", "staff"]);

  const [{ data: clients }, { data: serviceTypes }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, client_id, full_name")
      .order("full_name", { ascending: true }),
    supabase
      .from("service_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Voice notes</h1>
        <p className="mt-2 text-sm text-stone-600">
          Record your session summary out loud — AI transcribes and structures it into a case note
          for review before saving.
        </p>
      </div>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle>Record a case note</CardTitle>
          <CardDescription>
            Select a client, tap Start Recording, speak your summary, then review and save the
            AI-structured entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceServiceEntry clients={clients ?? []} serviceTypes={serviceTypes ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
