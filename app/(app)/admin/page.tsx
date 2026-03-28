import Link from "next/link";

import {
  deleteCustomFieldDefinitionAction,
  toggleCustomFieldActiveAction,
} from "@/app/actions/admin";
import { ClientCsvImportForm } from "@/components/forms/client-csv-import-form";
import { CustomFieldDefinitionForm } from "@/components/forms/custom-field-definition-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllCustomFieldDefinitions } from "@/lib/custom-fields";
import { requireRole } from "@/lib/auth";

type AdminPageProps = {
  searchParams: Promise<{
    action?: string;
    deleted?: string;
    entity?: string;
    error?: string;
    updated?: string;
  }>;
};

const outlineLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const { supabase } = await requireRole(["admin"]);
  const params = await searchParams;
  const actionFilter = params.action?.trim() ?? "";
  const entityFilter = params.entity?.trim() ?? "";

  let auditQuery = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(40);

  if (actionFilter) {
    auditQuery = auditQuery.eq("action", actionFilter);
  }

  if (entityFilter) {
    auditQuery = auditQuery.eq("entity_type", entityFilter);
  }

  const [definitions, { data: auditLogs, error: auditError }] = await Promise.all([
    getAllCustomFieldDefinitions(supabase),
    auditQuery,
  ]);

  if (auditError) {
    throw new Error(auditError.message);
  }

  return (
    <div className="space-y-6">
      {params.updated === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Field settings updated.
        </div>
      ) : null}
      {params.deleted === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Custom field removed.
        </div>
      ) : null}
      {params.error === "custom-fields" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We could not update that field definition. Try again.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Admin tools</h1>
          <p className="mt-2 text-sm text-stone-600">
            Manage imports, shape dynamic fields, and review change history from one page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={outlineLinkClassName} href="/api/templates/clients">
            Download CSV template
          </Link>
          <Link className={outlineLinkClassName} href="/api/exports/clients">
            Export clients CSV
          </Link>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ClientCsvImportForm />
        <CustomFieldDefinitionForm />
      </section>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle>Configured fields</CardTitle>
          <CardDescription>
            Toggle fields on or off without changing the underlying record workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {definitions.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <Table>
                <TableHeader className="bg-stone-50">
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Record type</TableHead>
                    <TableHead>Field type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {definitions.map((definition) => (
                    <TableRow key={definition.id}>
                      <TableCell>
                        <div className="font-medium text-stone-950">{definition.label}</div>
                        <div className="text-xs text-stone-500">{definition.field_key}</div>
                      </TableCell>
                      <TableCell className="capitalize text-stone-600">
                        {definition.entity_type.replace("_", " ")}
                      </TableCell>
                      <TableCell className="capitalize text-stone-600">
                        {definition.field_type}
                      </TableCell>
                      <TableCell>
                        <Badge variant={definition.is_active ? "secondary" : "outline"}>
                          {definition.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{definition.is_required ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <form action={toggleCustomFieldActiveAction}>
                            <input name="definitionId" type="hidden" value={definition.id} />
                            <input name="nextValue" type="hidden" value={String(!definition.is_active)} />
                            <Button type="submit" variant="outline">
                              {definition.is_active ? "Disable" : "Enable"}
                            </Button>
                          </form>
                          <form action={deleteCustomFieldDefinitionAction}>
                            <input name="definitionId" type="hidden" value={definition.id} />
                            <Button type="submit" variant="ghost">
                              Remove
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-sm text-stone-600">
              No configurable fields yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>
            Change history is stored for clients, service entries, appointments, and field definitions. Sensitive note bodies stay out of the log.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-col gap-3 sm:flex-row" method="get">
            <select
              className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm"
              defaultValue={entityFilter}
              name="entity"
            >
              <option value="">All entities</option>
              <option value="appointments">Appointments</option>
              <option value="clients">Clients</option>
              <option value="custom_field_definitions">Custom fields</option>
              <option value="service_entries">Service entries</option>
            </select>
            <select
              className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm"
              defaultValue={actionFilter}
              name="action"
            >
              <option value="">All actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>
          {auditLogs && auditLogs.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <Table>
                <TableHeader className="bg-stone-50">
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-stone-600">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize text-stone-600">{log.action}</TableCell>
                      <TableCell className="text-stone-600">{log.entity_type}</TableCell>
                      <TableCell className="text-stone-600">
                        {log.actor_profile_id ?? "System"}
                      </TableCell>
                      <TableCell className="max-w-md text-xs text-stone-600">
                        <pre className="whitespace-pre-wrap font-mono">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-sm text-stone-600">
              No audit events matched the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
