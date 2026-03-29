import { z } from "zod";

export const createAppointmentSchema = z.object({
  clientId: z.string().uuid("Select a client."),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15, "Appointment should be at least 15 minutes.")
    .max(480, "Appointment duration is too long."),
  location: z
    .string()
    .trim()
    .transform((value) => value || null),
  notes: z
    .string()
    .trim()
    .transform((value) => value || null),
  reminderStatus: z.enum(["not_needed", "pending", "sent"]),
  scheduledFor: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Enter a valid appointment date and time.",
    }),
});
