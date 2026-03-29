"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Circle, ExternalLink, Upload } from "lucide-react";

import {
  markSetupStepAction,
  updateOrganizationBrandingAction,
  updateOrganizationDetailsAction,
} from "@/app/actions/admin";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/lib/actions/form-state";
import type { OrganizationSettings } from "@/lib/organization-settings";

type SetupStep = {
  description: string;
  done: boolean;
  id: "branding" | "details" | "access" | "imports" | "launch";
  title: string;
};

type OrganizationSetupFormsProps = {
  accessCount: number;
  organizationSettings: OrganizationSettings;
  steps: readonly SetupStep[];
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-700">{message}</p>;
}

function SetupStepButton({
  description,
  done,
  step,
  title,
}: {
  description: string;
  done: boolean;
  step: "access" | "imports" | "launch";
  title: string;
}) {
  return (
    <form action={markSetupStepAction} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <input name="step" type="hidden" value={step} />
      <input name="value" type="hidden" value={String(!done)} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-stone-950">{title}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        </div>
        {done ? (
          <Badge className="brand-chip border-0">Complete</Badge>
        ) : (
          <Badge variant="outline">Needs review</Badge>
        )}
      </div>
      <Button className="mt-4" type="submit" variant={done ? "outline" : "default"}>
        {done ? "Mark incomplete" : "Mark complete"}
      </Button>
    </form>
  );
}

export function OrganizationSetupForms({
  accessCount,
  organizationSettings,
  steps,
}: OrganizationSetupFormsProps) {
  const [brandingState, brandingAction] = useActionState(
    updateOrganizationBrandingAction,
    initialActionState,
  );
  const [detailsState, detailsAction] = useActionState(
    updateOrganizationDetailsAction,
    initialActionState,
  );
  const completedSteps = steps.filter((step) => step.done).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <Card className="brand-card">
          <CardHeader>
            <CardTitle>1. Branding</CardTitle>
            <CardDescription>
              Make the workspace feel like the nonprofit’s own portal instead of a shared internal project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={brandingAction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization name</Label>
                  <Input defaultValue={organizationSettings.organization_name} id="organizationName" name="organizationName" />
                  <FieldError message={brandingState.fieldErrors?.organizationName?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboardHeadline">Admin dashboard headline override</Label>
                  <Input defaultValue={organizationSettings.dashboard_headline ?? ""} id="dashboardHeadline" name="dashboardHeadline" placeholder="Mission control for Community Bridge" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productSubtitle">Product subtitle</Label>
                <Input defaultValue={organizationSettings.product_subtitle} id="productSubtitle" name="productSubtitle" />
                <FieldError message={brandingState.fieldErrors?.productSubtitle?.[0]} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicWelcomeText">Public welcome text</Label>
                <Textarea defaultValue={organizationSettings.public_welcome_text} id="publicWelcomeText" name="publicWelcomeText" rows={4} />
                <FieldError message={brandingState.fieldErrors?.publicWelcomeText?.[0]} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary color</Label>
                  <Input defaultValue={organizationSettings.primary_color} id="primaryColor" name="primaryColor" type="color" />
                  <FieldError message={brandingState.fieldErrors?.primaryColor?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent color</Label>
                  <Input defaultValue={organizationSettings.accent_color} id="accentColor" name="accentColor" type="color" />
                  <FieldError message={brandingState.fieldErrors?.accentColor?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surfaceTint">Surface tint</Label>
                  <Input defaultValue={organizationSettings.surface_tint} id="surfaceTint" name="surfaceTint" type="color" />
                  <FieldError message={brandingState.fieldErrors?.surfaceTint?.[0]} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logoFile">Logo</Label>
                  <Input accept="image/png,image/jpeg,image/webp,image/svg+xml" id="logoFile" name="logoFile" type="file" />
                  <p className="text-xs text-stone-500">Used in the app header and login experience.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconFile">Favicon</Label>
                  <Input accept="image/png,image/x-icon,image/svg+xml" id="faviconFile" name="faviconFile" type="file" />
                  <p className="text-xs text-stone-500">Shown in browser tabs and bookmarks.</p>
                </div>
              </div>

              <FormMessage message={brandingState.message} tone={brandingState.status === "success" ? "success" : "error"} />
              <SubmitButton pendingLabel="Saving branding...">
                <Upload className="size-4" />
                Save branding
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle>2. Organization details</CardTitle>
            <CardDescription>
              Keep support instructions, login copy, and access guidance consistent for staff and clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={detailsAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginWelcomeText">Login welcome text</Label>
                <Textarea defaultValue={organizationSettings.login_welcome_text} id="loginWelcomeText" name="loginWelcomeText" rows={3} />
                <FieldError message={detailsState.fieldErrors?.loginWelcomeText?.[0]} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvedDomainGuidance">Access guidance</Label>
                <Textarea defaultValue={organizationSettings.approved_domain_guidance} id="approvedDomainGuidance" name="approvedDomainGuidance" rows={3} />
                <FieldError message={detailsState.fieldErrors?.approvedDomainGuidance?.[0]} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="supportEmail">Support email</Label>
                  <Input defaultValue={organizationSettings.support_email ?? ""} id="supportEmail" name="supportEmail" placeholder="support@nonprofit.org" type="email" />
                  <FieldError message={detailsState.fieldErrors?.supportEmail?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support phone</Label>
                  <Input defaultValue={organizationSettings.support_phone ?? ""} id="supportPhone" name="supportPhone" placeholder="(555) 555-0148" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportCtaText">Support CTA text</Label>
                <Input defaultValue={organizationSettings.support_cta_text} id="supportCtaText" name="supportCtaText" />
                <FieldError message={detailsState.fieldErrors?.supportCtaText?.[0]} />
              </div>

              <FormMessage message={detailsState.message} tone={detailsState.status === "success" ? "success" : "error"} />
              <SubmitButton pendingLabel="Saving details...">Save organization details</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle>3. Access model and launch checklist</CardTitle>
            <CardDescription>
              Keep the nonprofit launch process deliberate. The setup route stays visible until each critical handoff is reviewed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="font-medium text-stone-950">Approved access guidance</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {accessCount} approved email{accessCount === 1 ? "" : "s"} currently exist. Use the admin tools page to add initial admins, staff, and invite-only client portal addresses.
              </p>
              <Link className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-stone-900 underline-offset-4 hover:underline" href="/admin">
                Open admin tools
                <ExternalLink className="size-4" />
              </Link>
            </div>

            <SetupStepButton
              description="Confirm the first admin and staff emails are approved and document how this nonprofit will manage future access."
              done={organizationSettings.setup_progress.access}
              step="access"
              title="3. Access model"
            />
            <SetupStepButton
              description="Choose whether the organization will use CSV import, manual entry, or a staged migration. Point admins to the import tools when ready."
              done={organizationSettings.setup_progress.imports}
              step="imports"
              title="4. Starter data"
            />
            <SetupStepButton
              description="Use this when branding, support details, access setup, and initial data planning are complete and the portal is ready for real staff."
              done={organizationSettings.setup_progress.launch}
              step="launch"
              title="5. Review and launch"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="brand-card border shadow-sm">
          <CardHeader>
            <CardTitle>Workspace preview</CardTitle>
            <CardDescription>
              Preview how the login portal and shell will feel after branding is applied.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                {organizationSettings.logo_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`${organizationSettings.organization_name} logo`}
                      className="h-12 w-12 rounded-2xl border border-stone-200 object-cover"
                      src={organizationSettings.logo_url}
                    />
                  </>
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold"
                    style={{
                      backgroundColor: organizationSettings.primary_color,
                      color: "var(--brand-primary-foreground)",
                    }}
                  >
                    {organizationSettings.organization_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">Portal preview</p>
                  <p className="text-lg font-semibold text-stone-950">{organizationSettings.organization_name}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-stone-600">{organizationSettings.login_welcome_text}</p>
              <div className="mt-4 inline-flex rounded-full px-3 py-2 text-sm font-medium" style={{ backgroundColor: organizationSettings.primary_color, color: "var(--brand-primary-foreground)" }}>
                Continue with Google
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">Support card preview</p>
              <p className="mt-3 text-lg font-semibold text-stone-950">{organizationSettings.support_cta_text}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {organizationSettings.support_email || organizationSettings.support_phone || "Add a support email or phone number so staff and clients know where to ask for help."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle>Setup progress</CardTitle>
            <CardDescription>
              {completedSteps} of {steps.length} launch steps completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 size-5 text-stone-400" />
                )}
                <div>
                  <p className="font-medium text-stone-950">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{step.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle>Launch package</CardTitle>
            <CardDescription>
              Keep onboarding simple for the nonprofit by packaging the same deployment and support materials every time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-stone-600">
            <p>Include the branded deployment link, admin onboarding guide, staff quick-start, client portal one-pager, CSV templates, and a provisioning checklist.</p>
            <div className="flex flex-wrap gap-2">
              <Link className="inline-flex h-8 items-center justify-center rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100" href="/admin">
                Open admin tools
              </Link>
              <Link className="inline-flex h-8 items-center justify-center rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100" href="/api/templates/clients">
                Download CSV template
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
