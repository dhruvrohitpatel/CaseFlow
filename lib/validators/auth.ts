import { z } from "zod";
import zxcvbn from "zxcvbn";

// Score 0-1: too weak, 2: fair, 3: good, 4: strong
// We require at least score 3
const MIN_ZXCVBN_SCORE = 3;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.") // bcrypt truncates at 72 bytes
  .superRefine((val, ctx) => {
    const result = zxcvbn(val);

    if (result.score >= MIN_ZXCVBN_SCORE) {
      return;
    }

    const feedback = [result.feedback.warning, ...result.feedback.suggestions]
      .filter(Boolean)
      .join(" ");

    ctx.addIssue({
      code: "custom",
      message:
        feedback ||
        "Password is too weak. Try adding more words, numbers, or symbols.",
    });
  });

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."), // don't block existing users at sign-in
});

export const signUpSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
  password: passwordSchema,
});

export const resetPasswordSchema = z
  .object({
    confirmPassword: z.string().min(1, "Confirm your new password."),
    password: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"],
  });
