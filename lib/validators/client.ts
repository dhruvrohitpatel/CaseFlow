import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Enter a valid date.",
  })
  .transform((value) => (value ? value : null));

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => !value || z.email().safeParse(value).success, {
    message: "Enter a valid email address.",
  })
  .transform((value) => (value ? value : null));

const optionalPhone = z
  .string()
  .trim()
  .transform((value) => (value ? value : null));

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value ? value : null));

export const createClientSchema = z.object({
  dateOfBirth: optionalDate,
  email: optionalEmail,
  fullName: z.string().trim().min(2, "Full name is required."),
  housingStatus: z.string().trim().min(1, "Select a housing status."),
  phone: optionalPhone,
  preferredLanguage: z
    .string()
    .trim()
    .min(1, "Select a preferred language."),
  preferredName: optionalText,
  pronouns: optionalText,
  referralSource: z.string().trim().min(1, "Select a referral source."),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});
