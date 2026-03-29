import { z } from "zod";
import { fontPairKeySchema, themePresetKeySchema } from "@/lib/theme-presets";

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{6})$/, "Use a full 6-digit hex color such as #1c1917.");

const optionalTextSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  });

export const organizationBrandingSchema = z.object({
  accentColor: hexColorSchema,
  borderColor: hexColorSchema,
  canvasColor: hexColorSchema,
  cardColor: hexColorSchema,
  dashboardHeadline: optionalTextSchema,
  fontPairKey: fontPairKeySchema,
  imageryPrompt: optionalTextSchema,
  organizationName: z.string().trim().min(2, "Add the organization name."),
  primaryColor: hexColorSchema,
  productSubtitle: z.string().trim().min(12, "Add a short product subtitle."),
  publicWelcomeText: z.string().trim().min(20, "Add a short welcome message."),
  surfaceTint: hexColorSchema,
  themePresetKey: themePresetKeySchema,
});

export const organizationDetailsSchema = z.object({
  approvedDomainGuidance: z.string().trim().min(12, "Add short access guidance."),
  loginWelcomeText: z.string().trim().min(12, "Add a short login message."),
  supportCtaText: z.string().trim().min(2, "Add support CTA text."),
  supportEmail: z
    .union([z.string().email("Enter a valid support email."), z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      const normalized = value?.trim();

      return normalized ? normalized.toLowerCase() : null;
    }),
  supportPhone: optionalTextSchema,
});

export const setupProgressSchema = z.object({
  access: z.boolean().default(false),
  branding: z.boolean().default(false),
  details: z.boolean().default(false),
  imports: z.boolean().default(false),
  launch: z.boolean().default(false),
});

export type SetupProgress = z.infer<typeof setupProgressSchema>;
