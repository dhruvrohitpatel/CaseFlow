"use client";

import Link from "next/link";
import { useActionState, useState, type ChangeEvent } from "react";
import { CheckCircle2, Circle, ExternalLink, Sparkles, Upload } from "lucide-react";

import {
  applyThemeDraftAction,
  generateThemeDraftAction,
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
import { fontPairTokens, themePresets } from "@/lib/theme-presets";
import {
  BRANDING_ASSET_UPLOAD_RULE,
  formatUploadLimit,
  validateUploadFile,
} from "@/lib/uploads";

type SetupStep = {
  description: string;
  done: boolean;
  id: "branding" | "details" | "access" | "imports" | "launch";
  title: string;
};

type OrganizationSetupFormsProps = {
  accessCount: number;
  adminAiEnabled: boolean;
  adminAiPlanLabel: string;
  adminAiUnavailableMessage: string;
  organizationSettings: OrganizationSettings;
  steps: readonly SetupStep[];
  themeDrafts: Array<{
    applied_at: string | null;
    created_at: string;
    id: string;
    prompt: string;
    theme_recipe: Record<string, string | null>;
  }>;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-700">{message}</p>;
}

function getReadableTextColor(hex: string) {
  const sanitized = hex.replace("#", "");
  const red = Number.parseInt(sanitized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(sanitized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(sanitized.slice(4, 6), 16) / 255;
  const [r, g, b] = [red, green, blue].map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 0.55 ? "#1c1917" : "#fafaf9";
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
  adminAiEnabled,
  adminAiPlanLabel,
  adminAiUnavailableMessage,
  organizationSettings,
  steps,
  themeDrafts,
}: OrganizationSetupFormsProps) {
  const [brandingState, brandingAction] = useActionState(
    updateOrganizationBrandingAction,
    initialActionState,
  );
  const [detailsState, detailsAction] = useActionState(
    updateOrganizationDetailsAction,
    initialActionState,
  );
  const [themeDraftState, themeDraftAction] = useActionState(
    generateThemeDraftAction,
    initialActionState,
  );
  const [brandingFileErrors, setBrandingFileErrors] = useState<{
    faviconFile?: string;
    logoFile?: string;
  }>({});
  const completedSteps = steps.filter((step) => step.done).length;
  const [brandingValues, setBrandingValues] = useState({
    accentColor: organizationSettings.accent_color,
    borderColor: organizationSettings.border_color,
    canvasColor: organizationSettings.canvas_color,
    cardColor: organizationSettings.card_color,
    dashboardHeadline: organizationSettings.dashboard_headline ?? "",
    fontPairKey: organizationSettings.font_pair_key,
    imageryPrompt: organizationSettings.imagery_prompt ?? "",
    organizationName: organizationSettings.organization_name,
    primaryColor: organizationSettings.primary_color,
    productSubtitle: organizationSettings.product_subtitle,
    publicWelcomeText: organizationSettings.public_welcome_text,
    surfaceTint: organizationSettings.surface_tint,
    themePresetKey: organizationSettings.theme_preset_key,
  });
  const previewTextColor = getReadableTextColor(brandingValues.cardColor);
  const previewMutedColor = previewTextColor === "#fafaf9" ? "#d6d3d1" : "#57534e";

  function updateBrandingValue<Key extends keyof typeof brandingValues>(
    key: Key,
    value: (typeof brandingValues)[Key],
  ) {
    setBrandingValues((current) => ({ ...current, [key]: value }));
  }

  function applyPresetLocally(key: keyof typeof themePresets) {
    const preset = themePresets[key];

    setBrandingValues((current) => ({
      ...current,
      accentColor: preset.recipe.accent_color,
      borderColor: preset.recipe.border_color,
      canvasColor: preset.recipe.canvas_color,
      cardColor: preset.recipe.card_color,
      fontPairKey: preset.recipe.font_pair_key,
      imageryPrompt: preset.recipe.imagery_prompt ?? "",
      primaryColor: preset.recipe.primary_color,
      surfaceTint: preset.recipe.surface_tint,
      themePresetKey: preset.recipe.theme_preset_key,
    }));
  }

  function handleBrandAssetSelection(
    event: ChangeEvent<HTMLInputElement>,
    fieldName: "faviconFile" | "logoFile",
  ) {
    const nextFile = event.target.files?.[0];
    const nextError = nextFile
      ? validateUploadFile(nextFile, BRANDING_ASSET_UPLOAD_RULE)
      : undefined;

    setBrandingFileErrors((current) => ({
      ...current,
      [fieldName]: nextError ?? undefined,
    }));
  }

  const brandingSubmitDisabled = Boolean(
    brandingFileErrors.logoFile || brandingFileErrors.faviconFile,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <Card className="brand-card">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>1. Branding</CardTitle>
              <Badge variant="outline">Included in base</Badge>
            </div>
            <CardDescription>
              Set the organization name, theme, and brand assets. These settings update the public site, login screens, and dashboard shell.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={brandingAction} className="space-y-4">
              <div className="space-y-3">
                <Label>Theme preset</Label>
                <p className="text-sm text-stone-600">
                  Select a preset to update the preview instantly. Save branding once when the theme is ready.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(themePresets).map(([key, preset]) => (
                    <button
                      key={key}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        brandingValues.themePresetKey === key
                          ? "border-stone-900 bg-[rgb(var(--brand-surface-rgb)/0.5)]"
                          : "border-stone-200 bg-white hover:bg-stone-50"
                      }`}
                      onClick={() => applyPresetLocally(key as keyof typeof themePresets)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-stone-950">{preset.label}</p>
                        {brandingValues.themePresetKey === key ? (
                          <Badge className="brand-chip border-0">Active</Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-600">{preset.description}</p>
                      <div className="mt-3 flex gap-2">
                        {[preset.recipe.canvas_color, preset.recipe.card_color, preset.recipe.primary_color, preset.recipe.accent_color].map((swatch) => (
                          <span
                            key={`${key}-${swatch}`}
                            className="h-6 w-6 rounded-full border border-stone-300"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization name</Label>
                  <Input id="organizationName" name="organizationName" onChange={(event) => updateBrandingValue("organizationName", event.target.value)} value={brandingValues.organizationName} />
                  <FieldError message={brandingState.fieldErrors?.organizationName?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboardHeadline">Dashboard headline override</Label>
                  <Input id="dashboardHeadline" name="dashboardHeadline" onChange={(event) => updateBrandingValue("dashboardHeadline", event.target.value)} placeholder="Operations overview for Community Bridge" value={brandingValues.dashboardHeadline} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productSubtitle">Product subtitle</Label>
                <Input id="productSubtitle" name="productSubtitle" onChange={(event) => updateBrandingValue("productSubtitle", event.target.value)} value={brandingValues.productSubtitle} />
                <FieldError message={brandingState.fieldErrors?.productSubtitle?.[0]} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicWelcomeText">Public welcome text</Label>
                <Textarea id="publicWelcomeText" name="publicWelcomeText" onChange={(event) => updateBrandingValue("publicWelcomeText", event.target.value)} rows={4} value={brandingValues.publicWelcomeText} />
                <FieldError message={brandingState.fieldErrors?.publicWelcomeText?.[0]} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary color</Label>
                  <Input id="primaryColor" name="primaryColor" onChange={(event) => updateBrandingValue("primaryColor", event.target.value)} type="color" value={brandingValues.primaryColor} />
                  <FieldError message={brandingState.fieldErrors?.primaryColor?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent color</Label>
                  <Input id="accentColor" name="accentColor" onChange={(event) => updateBrandingValue("accentColor", event.target.value)} type="color" value={brandingValues.accentColor} />
                  <FieldError message={brandingState.fieldErrors?.accentColor?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surfaceTint">Surface tint</Label>
                  <Input id="surfaceTint" name="surfaceTint" onChange={(event) => updateBrandingValue("surfaceTint", event.target.value)} type="color" value={brandingValues.surfaceTint} />
                  <FieldError message={brandingState.fieldErrors?.surfaceTint?.[0]} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="canvasColor">Canvas color</Label>
                  <Input id="canvasColor" name="canvasColor" onChange={(event) => updateBrandingValue("canvasColor", event.target.value)} type="color" value={brandingValues.canvasColor} />
                  <FieldError message={brandingState.fieldErrors?.canvasColor?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardColor">Card color</Label>
                  <Input id="cardColor" name="cardColor" onChange={(event) => updateBrandingValue("cardColor", event.target.value)} type="color" value={brandingValues.cardColor} />
                  <FieldError message={brandingState.fieldErrors?.cardColor?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="borderColor">Border color</Label>
                  <Input id="borderColor" name="borderColor" onChange={(event) => updateBrandingValue("borderColor", event.target.value)} type="color" value={brandingValues.borderColor} />
                  <FieldError message={brandingState.fieldErrors?.borderColor?.[0]} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="themePresetKey">Selected theme mode</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400"
                    id="themePresetKey"
                    name="themePresetKey"
                    onChange={(event) => updateBrandingValue("themePresetKey", event.target.value as typeof brandingValues.themePresetKey)}
                    value={brandingValues.themePresetKey}
                  >
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                    <option value="noir">Noir</option>
                    <option value="notepad">Notepad</option>
                    <option value="custom">Custom</option>
                  </select>
                  <FieldError message={brandingState.fieldErrors?.themePresetKey?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontPairKey">Typography</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400"
                    id="fontPairKey"
                    name="fontPairKey"
                    onChange={(event) => updateBrandingValue("fontPairKey", event.target.value)}
                    value={brandingValues.fontPairKey}
                  >
                    {Object.keys(fontPairTokens).map((fontKey) => (
                      <option key={fontKey} value={fontKey}>
                        {fontKey}
                      </option>
                    ))}
                  </select>
                  <FieldError message={brandingState.fieldErrors?.fontPairKey?.[0]} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageryPrompt">Imagery direction</Label>
                <Textarea
                  id="imageryPrompt"
                  name="imageryPrompt"
                  onChange={(event) => updateBrandingValue("imageryPrompt", event.target.value)}
                  placeholder="Documentary photography, neighborhood service centers, clear operational signage."
                  rows={3}
                  value={brandingValues.imageryPrompt}
                />
                <FieldError message={brandingState.fieldErrors?.imageryPrompt?.[0]} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logoFile">Logo</Label>
                  <Input
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                    id="logoFile"
                    name="logoFile"
                    onChange={(event) => handleBrandAssetSelection(event, "logoFile")}
                    type="file"
                  />
                  <p className="text-xs text-stone-500">
                    Used in the app header and login experience. Max {formatUploadLimit(BRANDING_ASSET_UPLOAD_RULE.maxBytes)}.
                  </p>
                  <FieldError message={brandingFileErrors.logoFile} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconFile">Favicon</Label>
                  <Input
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                    id="faviconFile"
                    name="faviconFile"
                    onChange={(event) => handleBrandAssetSelection(event, "faviconFile")}
                    type="file"
                  />
                  <p className="text-xs text-stone-500">
                    Shown in browser tabs and bookmarks. Max {formatUploadLimit(BRANDING_ASSET_UPLOAD_RULE.maxBytes)}.
                  </p>
                  <FieldError message={brandingFileErrors.faviconFile} />
                </div>
              </div>

              <FormMessage message={brandingState.message} tone={brandingState.status === "success" ? "success" : "error"} />
              <SubmitButton disabled={brandingSubmitDisabled} pendingLabel="Saving branding...">
                <Upload className="size-4" />
                Save branding
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Theme generator</CardTitle>
              <Badge variant="outline">{adminAiPlanLabel}</Badge>
            </div>
            <CardDescription>
              {adminAiEnabled
                ? "Describe the organization and visual direction. The generated draft stays review-only until you apply it."
                : "Preset themes and manual branding are included in base. AI theme drafts are optional."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminAiEnabled ? (
              <form action={themeDraftAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="themePrompt">Theme prompt</Label>
                  <Textarea
                    id="themePrompt"
                    name="themePrompt"
                    placeholder="Housing nonprofit serving families. Use a darker workspace with strong contrast, warm neutrals, and clear field-operations styling."
                    rows={4}
                  />
                </div>
                <FormMessage
                  message={themeDraftState.message}
                  tone={themeDraftState.status === "success" ? "success" : "error"}
                />
                <SubmitButton pendingLabel="Generating draft...">
                  <Sparkles className="size-4" />
                  Generate theme draft
                </SubmitButton>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.42)] px-5 py-6 text-sm text-stone-600">
                {adminAiUnavailableMessage} Preset themes and manual branding controls stay available in every workspace.
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-medium text-stone-950">Recent drafts</p>
              {themeDrafts.length ? (
                themeDrafts.map((draft) => (
                  <div key={draft.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone-950">
                          {draft.applied_at ? "Applied draft" : "Draft ready for review"}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">{draft.prompt}</p>
                        <p className="mt-2 text-xs text-stone-500">
                          {new Date(draft.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!draft.applied_at ? (
                        <form action={applyThemeDraftAction}>
                          <input name="draftId" type="hidden" value={draft.id} />
                          <Button size="sm" type="submit" variant="outline">
                            Apply draft
                          </Button>
                        </form>
                      ) : (
                        <Badge className="brand-chip border-0">Applied</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {[
                        draft.theme_recipe.canvas_color,
                        draft.theme_recipe.card_color,
                        draft.theme_recipe.primary_color,
                        draft.theme_recipe.accent_color,
                      ]
                        .filter(Boolean)
                        .map((swatch) => (
                          <span
                            key={`${draft.id}-${swatch}`}
                            className="h-6 w-6 rounded-full border border-stone-300"
                            style={{ backgroundColor: String(swatch) }}
                          />
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-6 text-sm text-stone-600">
                  No drafts yet. Generate one from a written theme brief or choose a preset above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle>2. Organization details</CardTitle>
            <CardDescription>
              Set login copy, support contact details, and access guidance for staff and clients.
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
              Track the required launch steps. Keep access review, import planning, and final launch approval in one place.
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
              Preview the login portal and support panel with the current theme and branding settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="rounded-3xl border p-5 shadow-sm"
              style={{
                backgroundColor: brandingValues.cardColor,
                borderColor: brandingValues.borderColor,
                color: previewTextColor,
              }}
            >
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
                  <p className="text-sm font-medium uppercase tracking-[0.18em]" style={{ color: previewMutedColor }}>Portal preview</p>
                  <p className="text-lg font-semibold" style={{ color: previewTextColor }}>{brandingValues.organizationName}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6" style={{ color: previewMutedColor }}>{organizationSettings.login_welcome_text}</p>
              <div className="mt-4 inline-flex rounded-full px-3 py-2 text-sm font-medium" style={{ backgroundColor: brandingValues.primaryColor, color: getReadableTextColor(brandingValues.primaryColor) }}>
                Continue with Google
              </div>
            </div>

            <div
              className="rounded-3xl border p-5 shadow-sm"
              style={{
                backgroundColor: brandingValues.cardColor,
                borderColor: brandingValues.borderColor,
                color: previewTextColor,
              }}
            >
              <p className="text-sm font-medium uppercase tracking-[0.18em]" style={{ color: previewMutedColor }}>Support card preview</p>
              <p className="mt-3 text-lg font-semibold" style={{ color: previewTextColor }}>{organizationSettings.support_cta_text}</p>
              <p className="mt-2 text-sm leading-6" style={{ color: previewMutedColor }}>
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
              Package the same deployment, onboarding, and import materials for each organization launch.
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
