import { z } from "zod";

export const createAccessAllowlistEntrySchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    linkedClientId: z.string().uuid().optional().or(z.literal("")),
    notes: z.string().trim().max(500, "Notes must be 500 characters or fewer.").optional().or(z.literal("")),
    role: z.enum(["admin", "staff", "client"]),
  })
  .superRefine((value, ctx) => {
    if (value.role === "client" && !value.linkedClientId) {
      ctx.addIssue({
        code: "custom",
        message: "Select a client record for client portal access.",
        path: ["linkedClientId"],
      });
    }

    if (value.role !== "client" && value.linkedClientId) {
      ctx.addIssue({
        code: "custom",
        message: "Only client access entries can be linked to a client record.",
        path: ["linkedClientId"],
      });
    }
  });
