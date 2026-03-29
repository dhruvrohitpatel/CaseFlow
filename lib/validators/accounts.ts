import { z } from "zod";

export const createManagedAccountSchema = z
  .object({
    accountType: z.enum(["staff", "client"]),
    clientRecordId: z.string().uuid().optional().or(z.literal("")),
    email: z.string().trim().email("Enter a valid email address."),
    fullName: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.accountType === "staff") {
      if (!value.fullName || value.fullName.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Full name is required for staff accounts.",
          path: ["fullName"],
        });
      }

      return;
    }

    if (!value.clientRecordId) {
      ctx.addIssue({
        code: "custom",
        message: "Select a client record to link this portal account.",
        path: ["clientRecordId"],
      });
    }
  });
