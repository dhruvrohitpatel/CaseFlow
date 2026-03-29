import { format } from "date-fns";
import { notFound } from "next/navigation";

import { CustomFieldDisplayList } from "@/components/custom-fields/custom-field-display-list";
import { ClientStatusForm } from "@/components/forms/client-status-form";
import { ServiceEntryForm } from "@/components/forms/service-entry-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getStaffDisplayName, requireRole } from "@/lib/auth";
import {
  buildDisplayValues,
  buildGroupedServiceDisplayValues,
  getActiveCustomFieldDefinitions,
  getClientCustomFieldValues,
  getServiceEntryCustomFieldValues,
} from "@/lib/custom-fields";

type ClientProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    error?: string;
    logged?: string;
    updated?: string;
  }>;
};

export default async function ClientProfilePage({
  params,
  searchParams,
}: ClientProfilePageProps) {
  const { id } = await params;
  const { created, error, logged, updated } = await searchParams;
  const { profile, supabase, user } = await requireRole(["admin", "staff"]);

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("client_id", id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  const [
    { data: serviceTypes, error: serviceTypesError },
    { data: serviceEntries, error: serviceEntriesError },
    clientCustomDefinitions,
    serviceCustomDefinitions,
  ] = await Promise.all([
    supabase
      .from("service_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("service_entries")
      .select("id, service_date, notes, staff_member_name, service_types(name)")
      .eq("client_id", client.id)
      .order("service_date", { ascending: false })
      .order("created_at", { ascending: false }),
    getActiveCustomFieldDefinitions(supabase, "client"),
    getActiveCustomFieldDefinitions(supabase, "service_entry"),
  ]);

  if (serviceTypesError || serviceEntriesError) {
    throw new Error(serviceTypesError?.message ?? serviceEntriesError?.message);
  }

  const history =
    serviceEntries?.map((entry) => ({
      ...entry,
      serviceTypeName:
        Array.isArray(entry.service_types) && entry.service_types.length > 0
          ? entry.service_types[0]?.name
          : (entry.service_types as { name?: string } | null)?.name ?? "Service",
    })) ?? [];
  const [clientCustomValues, serviceCustomValues] = await Promise.all([
    getClientCustomFieldValues(supabase, client.id),
    getServiceEntryCustomFieldValues(
      supabase,
      history.map((entry) => entry.id),
    ),
  ]);
  const clientDisplayValues = buildDisplayValues(
    clientCustomDefinitions,
    clientCustomValues,
  );
  const serviceDisplayValues = buildGroupedServiceDisplayValues(
    serviceCustomDefinitions,
    serviceCustomValues,
  );

  return (
    <div className="space-y-6">
      {created === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Client created successfully. The generated public client ID is <strong>{client.client_id}</strong>.
        </div>
      ) : null}
      {logged === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Service entry saved successfully.
        </div>
      ) : null}
      {updated === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Client status updated.
        </div>
      ) : null}
      {error === "status" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We could not update the client status. Try again.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{client.full_name}</h1>
            <Badge variant="secondary">{client.client_id}</Badge>
            <Badge className="capitalize" variant="outline">{client.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Demographics, custom fields, and service history stay together so staff can work from one page.
          </p>
        </div>
        <ClientStatusForm clientPublicId={client.client_id} status={client.status} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle>Client profile</CardTitle>
            <CardDescription>Core demographics and contact information for staff.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-stone-500">Preferred name</p>
              <p className="mt-1 text-sm text-stone-900">{client.preferred_name ?? "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Date of birth</p>
              <p className="mt-1 text-sm text-stone-900">
                {client.date_of_birth ? format(new Date(client.date_of_birth), "MMMM d, yyyy") : "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Phone</p>
              <p className="mt-1 text-sm text-stone-900">{client.phone ?? "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Email</p>
              <p className="mt-1 text-sm text-stone-900">{client.email ?? "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Preferred language</p>
              <p className="mt-1 text-sm text-stone-900">{client.preferred_language}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Pronouns</p>
              <p className="mt-1 text-sm text-stone-900">{client.pronouns ?? "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Housing status</p>
              <p className="mt-1 text-sm text-stone-900">{client.housing_status}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-500">Referral source</p>
              <p className="mt-1 text-sm text-stone-900">{client.referral_source}</p>
            </div>
            <div className="sm:col-span-2">
              <Separator />
            </div>
            <div className="sm:col-span-2">
              <CustomFieldDisplayList
                emptyMessage="No admin-defined client fields have been filled in yet."
                title="Custom profile fields"
                values={clientDisplayValues}
              />
            </div>
          </CardContent>
        </Card>

        <ServiceEntryForm
          clientPublicId={client.client_id}
          customFieldDefinitions={serviceCustomDefinitions}
          serviceTypes={serviceTypes ?? []}
          staffMemberName={getStaffDisplayName(profile, user.email)}
        />
      </section>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle>Service history</CardTitle>
          <CardDescription>
            Reverse chronological history of services, visits, and follow-up notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{entry.serviceTypeName}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {format(new Date(entry.service_date), "MMMM d, yyyy")} by {entry.staff_member_name}
                      </p>
                    </div>
                    <Badge variant="outline">Service log</Badge>
                  </div>
                  <p className="text-sm leading-6 text-stone-700">{entry.notes}</p>
                  {serviceDisplayValues.get(entry.id)?.length ? (
                    <div className="rounded-xl bg-stone-50 p-4">
                      <CustomFieldDisplayList
                        emptyMessage=""
                        title="Custom service fields"
                        values={serviceDisplayValues.get(entry.id) ?? []}
                      />
                    </div>
                  ) : null}
                  {index < history.length - 1 ? <Separator /> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
              <p className="text-base font-medium text-stone-900">No service history yet.</p>
              <p className="mt-2 text-sm text-stone-600">
                Use the service entry form above to add the client’s first visit.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
