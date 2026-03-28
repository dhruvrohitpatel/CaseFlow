import { z } from "zod";

export const createServiceEntrySchema = z.object({
  clientPublicId: z.string().trim().min(1),
  notes: z.string().trim().min(10, "Notes should be at least 10 characters."),
  serviceDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Enter a valid service date.",
    }),
  serviceTypeId: z.string().uuid("Select a service type."),
});
