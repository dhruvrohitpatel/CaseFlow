import { cache } from "react";

import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fontPairTokens,
  getThemePreset,
  type ThemePresetKey,
  themePresetKeySchema,
} from "@/lib/theme-presets";
import {
  setupProgressSchema,
  type SetupProgress,
} from "@/lib/validators/organization-settings";

type OrganizationSettingsRow = Database["public"]["Tables"]["organization_settings"]["Row"];

export type OrganizationSettings = Omit<OrganizationSettingsRow, "setup_progress"> & {
  setup_progress: SetupProgress;
};

const DEFAULT_SETUP_PROGRESS: SetupProgress = {
  access: false,
  branding: false,
  details: false,
  imports: false,
  launch: false,
};

const DEFAULT_ORGANIZATION_SETTINGS = {
  accent_color: "#d9d2c4",
  approved_domain_guidance:
    "Access is managed through approved emails and invite-only client portals.",
  border_color: "#ddd6ce",
  canvas_color: "#f4efe8",
  card_color: "#fffdf8",
  dashboard_headline: null,
  favicon_url: null,
  font_pair_key: "system-sans",
  imagery_prompt:
    "Documentary photography, daylight interiors, organized desks, community service operations.",
  login_welcome_text:
    "Use your approved organization account to access your CaseFlow workspace.",
  logo_url: null,
  organization_name: "CaseFlow",
  primary_color: "#1c1917",
  product_subtitle:
    "Case management and client portals, branded for your organization.",
  public_welcome_text:
    "Support staff, clients, and administrators from one portal branded for your organization.",
  setup_completed_at: null,
  setup_progress: DEFAULT_SETUP_PROGRESS,
  support_cta_text: "Contact support",
  support_email: null,
  support_phone: null,
  surface_tint: "#efe8dd",
  theme_preset_key: "day",
} satisfies Partial<OrganizationSettings>;

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return fallback;
  }

  return /^#(?:[0-9a-fA-F]{6})$/.test(normalized) ? normalized : fallback;
}

function normalizeText(value: string | null | undefined, fallback: string | null = null) {
  const normalized = value?.trim();

  return normalized ? normalized : fallback;
}

function toRgbTriplet(hex: string) {
  const sanitized = hex.replace("#", "");

  const red = Number.parseInt(sanitized.slice(0, 2), 16);
  const green = Number.parseInt(sanitized.slice(2, 4), 16);
  const blue = Number.parseInt(sanitized.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
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

function resolveThemeDefaults(presetKey: ThemePresetKey) {
  const preset = getThemePreset(presetKey);

  return {
    accent_color: preset?.recipe.accent_color ?? DEFAULT_ORGANIZATION_SETTINGS.accent_color,
    border_color: preset?.recipe.border_color ?? DEFAULT_ORGANIZATION_SETTINGS.border_color,
    canvas_color: preset?.recipe.canvas_color ?? DEFAULT_ORGANIZATION_SETTINGS.canvas_color,
    card_color: preset?.recipe.card_color ?? DEFAULT_ORGANIZATION_SETTINGS.card_color,
    font_pair_key: preset?.recipe.font_pair_key ?? DEFAULT_ORGANIZATION_SETTINGS.font_pair_key,
    imagery_prompt:
      preset?.recipe.imagery_prompt ?? DEFAULT_ORGANIZATION_SETTINGS.imagery_prompt,
    primary_color: preset?.recipe.primary_color ?? DEFAULT_ORGANIZATION_SETTINGS.primary_color,
    surface_tint: preset?.recipe.surface_tint ?? DEFAULT_ORGANIZATION_SETTINGS.surface_tint,
    theme_preset_key:
      preset?.recipe.theme_preset_key ?? DEFAULT_ORGANIZATION_SETTINGS.theme_preset_key,
  };
}

function normalizeOrganizationSettings(
  row: OrganizationSettingsRow | null | undefined,
): OrganizationSettings {
  const presetKey = themePresetKeySchema.catch("day").parse(row?.theme_preset_key ?? "day");
  const defaults = resolveThemeDefaults(presetKey);

  const primaryColor = normalizeHexColor(row?.primary_color, defaults.primary_color);
  const accentColor = normalizeHexColor(row?.accent_color, defaults.accent_color);
  const surfaceTint = normalizeHexColor(row?.surface_tint, defaults.surface_tint);
  const canvasColor = normalizeHexColor(row?.canvas_color, defaults.canvas_color);
  const cardColor = normalizeHexColor(row?.card_color, defaults.card_color);
  const borderColor = normalizeHexColor(row?.border_color, defaults.border_color);

  return {
    accent_color: accentColor,
    approved_domain_guidance: normalizeText(
      row?.approved_domain_guidance,
      DEFAULT_ORGANIZATION_SETTINGS.approved_domain_guidance,
    )!,
    border_color: borderColor,
    canvas_color: canvasColor,
    card_color: cardColor,
    created_at: row?.created_at ?? new Date(0).toISOString(),
    dashboard_headline: normalizeText(row?.dashboard_headline),
    favicon_url: normalizeText(row?.favicon_url),
    font_pair_key: row?.font_pair_key?.trim() || defaults.font_pair_key,
    id: row?.id ?? "default-organization",
    imagery_prompt: normalizeText(row?.imagery_prompt, defaults.imagery_prompt),
    login_welcome_text: normalizeText(
      row?.login_welcome_text,
      DEFAULT_ORGANIZATION_SETTINGS.login_welcome_text,
    )!,
    logo_url: normalizeText(row?.logo_url),
    organization_name: normalizeText(
      row?.organization_name,
      DEFAULT_ORGANIZATION_SETTINGS.organization_name,
    )!,
    primary_color: primaryColor,
    product_subtitle: normalizeText(
      row?.product_subtitle,
      DEFAULT_ORGANIZATION_SETTINGS.product_subtitle,
    )!,
    public_welcome_text: normalizeText(
      row?.public_welcome_text,
      DEFAULT_ORGANIZATION_SETTINGS.public_welcome_text,
    )!,
    setup_completed_at: row?.setup_completed_at ?? null,
    setup_progress: setupProgressSchema.parse(row?.setup_progress ?? DEFAULT_SETUP_PROGRESS),
    support_cta_text: normalizeText(
      row?.support_cta_text,
      DEFAULT_ORGANIZATION_SETTINGS.support_cta_text,
    )!,
    support_email: normalizeText(row?.support_email),
    support_phone: normalizeText(row?.support_phone),
    surface_tint: surfaceTint,
    theme_preset_key: presetKey,
    updated_at: row?.updated_at ?? new Date(0).toISOString(),
  };
}

export const getOrganizationSettings = cache(async () => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organization_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return normalizeOrganizationSettings(data);
  }

  const { data: created, error: createError } = await supabase
    .from("organization_settings")
    .insert({
      accent_color: DEFAULT_ORGANIZATION_SETTINGS.accent_color,
      approved_domain_guidance: DEFAULT_ORGANIZATION_SETTINGS.approved_domain_guidance,
      border_color: DEFAULT_ORGANIZATION_SETTINGS.border_color,
      canvas_color: DEFAULT_ORGANIZATION_SETTINGS.canvas_color,
      card_color: DEFAULT_ORGANIZATION_SETTINGS.card_color,
      font_pair_key: DEFAULT_ORGANIZATION_SETTINGS.font_pair_key,
      imagery_prompt: DEFAULT_ORGANIZATION_SETTINGS.imagery_prompt,
      login_welcome_text: DEFAULT_ORGANIZATION_SETTINGS.login_welcome_text,
      organization_name: DEFAULT_ORGANIZATION_SETTINGS.organization_name,
      primary_color: DEFAULT_ORGANIZATION_SETTINGS.primary_color,
      product_subtitle: DEFAULT_ORGANIZATION_SETTINGS.product_subtitle,
      public_welcome_text: DEFAULT_ORGANIZATION_SETTINGS.public_welcome_text,
      setup_progress: DEFAULT_ORGANIZATION_SETTINGS.setup_progress,
      support_cta_text: DEFAULT_ORGANIZATION_SETTINGS.support_cta_text,
      surface_tint: DEFAULT_ORGANIZATION_SETTINGS.surface_tint,
      theme_preset_key: DEFAULT_ORGANIZATION_SETTINGS.theme_preset_key,
    })
    .select("*")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return normalizeOrganizationSettings(created);
});

export function isSetupComplete(settings: OrganizationSettings) {
  return Object.values(settings.setup_progress).every(Boolean);
}

export function getSetupChecklist(settings: OrganizationSettings) {
  return [
    {
      description: "Set the organization name, theme, and brand assets.",
      done: settings.setup_progress.branding,
      id: "branding",
      title: "Branding",
    },
    {
      description: "Add login copy and support contact details for staff and clients.",
      done: settings.setup_progress.details,
      id: "details",
      title: "Organization details",
    },
    {
      description: "Review allowlist access rules and add the first admin and staff addresses.",
      done: settings.setup_progress.access,
      id: "access",
      title: "Access model",
    },
    {
      description: "Choose how this organization will import or seed its initial client records.",
      done: settings.setup_progress.imports,
      id: "imports",
      title: "Starter data",
    },
    {
      description: "Review the workspace, test the portal, and mark the launch step complete.",
      done: settings.setup_progress.launch,
      id: "launch",
      title: "Review and launch",
    },
  ] as const;
}

export function getThemeCssVariables(settings: OrganizationSettings) {
  const primaryForeground = getReadableTextColor(settings.primary_color);
  const accentForeground = getReadableTextColor(settings.accent_color);
  const canvasForeground = getReadableTextColor(settings.canvas_color);
  const cardForeground = getReadableTextColor(settings.card_color);
  const mutedForeground =
    getReadableTextColor(settings.surface_tint) === "#fafaf9" ? "#d6d3d1" : "#57534e";
  const fontPair =
    fontPairTokens[settings.font_pair_key as keyof typeof fontPairTokens] ??
    fontPairTokens["system-sans"];

  return {
    "--accent": settings.accent_color,
    "--accent-foreground": accentForeground,
    "--background": settings.canvas_color,
    "--border": settings.border_color,
    "--brand-accent": settings.accent_color,
    "--brand-accent-foreground": accentForeground,
    "--brand-accent-rgb": toRgbTriplet(settings.accent_color),
    "--brand-border": settings.border_color,
    "--brand-border-rgb": toRgbTriplet(settings.border_color),
    "--brand-canvas": settings.canvas_color,
    "--brand-canvas-foreground": canvasForeground,
    "--brand-canvas-rgb": toRgbTriplet(settings.canvas_color),
    "--brand-card": settings.card_color,
    "--brand-card-foreground": cardForeground,
    "--brand-card-rgb": toRgbTriplet(settings.card_color),
    "--brand-primary": settings.primary_color,
    "--brand-primary-foreground": primaryForeground,
    "--brand-primary-rgb": toRgbTriplet(settings.primary_color),
    "--brand-surface": settings.surface_tint,
    "--brand-surface-rgb": toRgbTriplet(settings.surface_tint),
    "--card": settings.card_color,
    "--card-foreground": cardForeground,
    "--font-body": fontPair.body,
    "--font-heading": fontPair.heading,
    "--foreground": canvasForeground,
    "--input": settings.border_color,
    "--muted": settings.surface_tint,
    "--muted-foreground": mutedForeground,
    "--popover": settings.card_color,
    "--popover-foreground": cardForeground,
    "--primary": settings.primary_color,
    "--primary-foreground": primaryForeground,
    "--ring": settings.accent_color,
    "--secondary": settings.surface_tint,
    "--secondary-foreground": canvasForeground,
    "--sidebar": settings.card_color,
    "--sidebar-accent": settings.surface_tint,
    "--sidebar-accent-foreground": canvasForeground,
    "--sidebar-border": settings.border_color,
    "--sidebar-foreground": canvasForeground,
    "--sidebar-primary": settings.primary_color,
    "--sidebar-primary-foreground": primaryForeground,
    "--sidebar-ring": settings.accent_color,
  } as Record<string, string>;
}

export function getSupportHref(settings: OrganizationSettings) {
  if (settings.support_email) {
    return `mailto:${settings.support_email}`;
  }

  if (settings.support_phone) {
    return `tel:${settings.support_phone.replace(/[^\d+]/g, "")}`;
  }

  return null;
}
