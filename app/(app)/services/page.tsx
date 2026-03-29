import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("ServicesPage");

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
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-stone-600">
          {t("pageDescription")}
        </p>
      </div>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>
            {t("cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceServiceEntry clients={clients ?? []} serviceTypes={serviceTypes ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
