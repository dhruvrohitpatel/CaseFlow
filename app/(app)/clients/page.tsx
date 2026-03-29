import Link from "next/link";
import { Search, UserRoundPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";

const primaryLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800";
const ghostLinkClassName =
  "inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[0.8rem] font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-950";

type ClientsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { supabase } = await requireRole(["admin", "staff"]);
  const [params, t] = await Promise.all([searchParams, getTranslations("ClientsPage")]);
  const query = params.q?.trim() ?? "";

  let clientQuery = supabase
    .from("clients")
    .select("client_id, full_name, phone, preferred_language, created_at, status")
    .order("created_at", { ascending: false });

  if (query) {
    clientQuery = clientQuery.ilike("full_name", `%${query}%`);
  }

  const { data: clients, error } = await clientQuery;

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{t("pageTitle")}</h1>
          <p className="mt-2 text-sm text-stone-600">
            {t("pageDescription")}
          </p>
        </div>
        <Link className={primaryLinkClassName} href="/clients/new">
          <UserRoundPlus className="size-4" />
          {t("newClient")}
        </Link>
      </div>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>
            {t("cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-col gap-3 sm:flex-row" method="get">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <input
                className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 text-sm outline-none transition-colors focus:border-stone-400"
                defaultValue={query}
                name="q"
                placeholder={t("searchPlaceholder")}
              />
            </div>
            <Button type="submit" variant="outline">
              {t("searchButton")}
            </Button>
          </form>

          {clients && clients.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <Table>
                <TableHeader className="bg-stone-50">
                  <TableRow>
                    <TableHead>{t("tableHeadClient")}</TableHead>
                    <TableHead>{t("tableHeadPublicId")}</TableHead>
                    <TableHead>{t("tableHeadPhone")}</TableHead>
                    <TableHead>{t("tableHeadLanguage")}</TableHead>
                    <TableHead>{t("tableHeadStatus")}</TableHead>
                    <TableHead className="text-right">{t("tableHeadOpen")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.client_id}>
                      <TableCell>
                        <div className="font-medium text-stone-950">{client.full_name}</div>
                      </TableCell>
                      <TableCell className="text-stone-600">{client.client_id}</TableCell>
                      <TableCell className="text-stone-600">{client.phone ?? t("phoneNotProvided")}</TableCell>
                      <TableCell className="text-stone-600">{client.preferred_language}</TableCell>
                      <TableCell className="capitalize text-stone-600">{client.status}</TableCell>
                      <TableCell className="text-right">
                        <Link className={ghostLinkClassName} href={`/clients/${client.client_id}`}>
                          {t("viewProfile")}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
              <p className="text-base font-medium text-stone-900">
                {query ? t("emptySearchTitle") : t("emptyTitle")}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                {query ? t("emptySearchDescription") : t("emptyDescription")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
