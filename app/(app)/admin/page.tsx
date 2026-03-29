import Link from "next/link";

import {
  deleteAllowlistEntryAction,
  deleteCustomFieldDefinitionAction,
  toggleAllowlistEntryActiveAction,
  toggleCustomFieldActiveAction,
} from "@/app/actions/admin";
import {
  ApproveClientAccessForm,
  ApproveTeamAccessForm,
} from "@/components/forms/access-allowlist-forms";
import { ClientCsvImportForm } from "@/components/forms/client-csv-import-form";
import { CustomFieldDefinitionForm } from "@/components/forms/custom-field-definition-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageErrorState } from "@/components/ui/page-error-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllCustomFieldDefinitions } from "@/lib/custom-fields";
import { requireRole } from "@/lib/auth";
import { getOrganizationSettings, isSetupComplete } from "@/lib/organization-settings";

type AdminPageProps = {
  searchParams: Promise<{
    action?: string;
    accessDeleted?: string;
    accessUpdated?: string;
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

  const [definitionsResult, settingsResult, { data: auditLogs, error: auditError }] = await Promise.all([
    getAllCustomFieldDefinitions(supabase)
      .then((data) => ({ data, error: null }))
      .catch((error: unknown) => ({
        data: [],
        error:
          error instanceof Error
            ? error.message
            : "Custom field definitions could not be loaded.",
      })),
    getOrganizationSettings()
      .then((data) => ({ data, error: null }))
      .catch((error: unknown) => ({
        data: null,
        error:
          error instanceof Error ? error.message : "Workspace settings could not be loaded.",
      })),
    auditQuery,
  ]);

  const [
    { data: accessEntries, error: accessEntriesError },
    { data: clients, error: clientsError },
  ] = await Promise.all([
    supabase
      .from("access_allowlist")
      .select("id, email, role, is_active, notes, linked_client_id, created_at")
      .order("role", { ascending: true })
      .order("email", { ascending: true }),
    supabase
      .from("clients")
      .select("id, client_id, full_name, email, status, portal_profile_id")
      .order("full_name", { ascending: true }),
  ]);

  const pageError =
    settingsResult.error ??
    definitionsResult.error ??
    auditError?.message ??
    accessEntriesError?.message ??
    clientsError?.message ??
    null;
  const definitions = definitionsResult.data;
  const settings = settingsResult.data;

  const clientLabelById = new Map(
    (clients ?? []).map((client) => [client.id, `${client.full_name} (${client.client_id})`]),
  );
  const allowlistedClientIds = new Set(
    (accessEntries ?? [])
      .filter((entry) => entry.role === "client" && entry.linked_client_id)
      .map((entry) => entry.linked_client_id),
  );
  const availableClients =
    clients
      ?.filter((client) => !allowlistedClientIds.has(client.id))
      .map((client) => ({
        id: client.id,
        label: `${client.full_name} (${client.client_id})`,
      })) ?? [];
  const setupComplete = settings ? isSetupComplete(settings) : false;

  return (
    <div className="space-y-6">
      {params.accessUpdated === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Approved access updated.
        </div>
      ) : null}
      {params.accessDeleted === "1" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Approved access removed.
        </div>
      ) : null}
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
      {params.error === "allowlist" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We could not update that approved access entry. Try again.
        </div>
      ) : null}
      {pageError ? (
        <PageErrorState description={pageError} title="Some admin data is unavailable." />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">Admin tools</h1>
          <p className="mt-2 text-sm text-stone-600">
            Manage approved access, imports, field configuration, and change history from one page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={outlineLinkClassName} href="/setup">
            {setupComplete ? "Reopen setup guide" : "Open setup guide"}
          </Link>
          <Link className={outlineLinkClassName} href="/dashboard/customize?scope=role&targetRole=admin">
            Customize dashboards
          </Link>
          <Link className={outlineLinkClassName} href="/admin/import-assistant">
            Open import assistant
          </Link>
          <Link className={outlineLinkClassName} href="/api/templates/clients">
            Download CSV template
          </Link>
          <Link className={outlineLinkClassName} href="/api/exports/clients">
            Export clients CSV
          </Link>
        </div>
      </div>

      <Card className="brand-card border shadow-sm">
        <CardHeader>
          <CardTitle>Workspace profile</CardTitle>
          <CardDescription>
            Review branding, setup status, and admin operations for this deployment.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <div className="text-lg font-semibold text-stone-950">
              {settings?.organization_name ?? "Workspace profile"}
            </div>
            <p className="mt-1 text-sm text-stone-600">{settings?.product_subtitle ?? "Workspace details are temporarily unavailable."}</p>
            <p className="mt-2 text-sm text-stone-500">
              Support contact: {settings?.support_email ?? settings?.support_phone ?? "Not configured yet"}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Theme mode: {settings?.theme_preset_key ?? "Unavailable"}
            </p>
          </div>
          <Badge className="brand-chip border-0">{setupComplete ? "Launch ready" : "Setup in progress"}</Badge>
          <Link className={outlineLinkClassName} href="/setup">
            Update branding
          </Link>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <ApproveTeamAccessForm />
        <ApproveClientAccessForm clients={availableClients} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ClientCsvImportForm />
        <CustomFieldDefinitionForm />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Approved access</CardTitle>
            <CardDescription>
              Access is controlled by email allowlist. Google is preferred, and password fallback works only for approved emails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accessEntries && accessEntries.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-stone-200">
                <Table>
                  <TableHeader className="bg-stone-50/80">
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Linked client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="max-w-[16rem] truncate text-stone-700">{entry.email}</TableCell>
                        <TableCell>
                          <Badge className="capitalize" variant="outline">
                            {entry.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entry.linked_client_id ? (
                            <span className="text-sm text-stone-600">
                              {clientLabelById.get(entry.linked_client_id) ?? "Client record"}
                            </span>
                          ) : (
                            <span className="text-sm text-stone-400">Not linked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={entry.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
                            variant={entry.is_active ? "outline" : "outline"}
                          >
                            {entry.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <form action={toggleAllowlistEntryActiveAction}>
                              <input name="entryId" type="hidden" value={entry.id} />
                              <input name="nextValue" type="hidden" value={String(!entry.is_active)} />
                              <input name="returnTo" type="hidden" value="/admin" />
                              <Button size="sm" type="submit" variant="outline">
                                {entry.is_active ? "Deactivate" : "Activate"}
                              </Button>
                            </form>
                            <form action={deleteAllowlistEntryAction}>
                              <input name="entryId" type="hidden" value={entry.id} />
                              <input name="returnTo" type="hidden" value="/admin" />
                              <Button className="text-red-700 hover:bg-red-50 hover:text-red-800" size="sm" type="submit" variant="ghost">
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
                No approved access entries yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Current client portal links</CardTitle>
            <CardDescription>
              These records are currently bound to a signed-in client profile. The allowlist entry is still the source of truth for future access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients && clients.some((client) => client.portal_profile_id) ? (
              <div className="overflow-hidden rounded-xl border border-stone-200">
                <Table>
                  <TableHeader className="bg-stone-50">
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Portal email</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.filter((client) => client.portal_profile_id).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="font-medium text-stone-950">{client.full_name}</div>
                          <div className="text-xs text-stone-500">{client.client_id}</div>
                        </TableCell>
                        <TableCell className="text-stone-600">{client.email ?? "No email set"}</TableCell>
                        <TableCell>
                          <Badge className="capitalize" variant="secondary">
                            {client.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-sm text-stone-600">
                No client portal accounts are linked yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="brand-card border shadow-sm">
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
                        <Badge
                          className={definition.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
                          variant="outline"
                        >
                          {definition.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{definition.is_required ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <form action={toggleCustomFieldActiveAction}>
                            <input name="definitionId" type="hidden" value={definition.id} />
                            <input name="nextValue" type="hidden" value={String(!definition.is_active)} />
                            <input name="returnTo" type="hidden" value="/admin" />
                            <Button size="sm" type="submit" variant="outline">
                              {definition.is_active ? "Disable" : "Enable"}
                            </Button>
                          </form>
                          <form action={deleteCustomFieldDefinitionAction}>
                            <input name="definitionId" type="hidden" value={definition.id} />
                            <input name="returnTo" type="hidden" value="/admin" />
                            <Button className="text-red-700 hover:bg-red-50 hover:text-red-800" size="sm" type="submit" variant="ghost">
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

      <Card className="brand-card border shadow-sm">
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
