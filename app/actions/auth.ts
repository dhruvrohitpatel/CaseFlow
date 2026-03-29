"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { type ActionState } from "@/lib/actions/form-state";
import {
  AccessNotApprovedError,
  getAllowlistEntryByEmail,
  normalizeEmail,
  syncUserAccessFromAllowlist,
} from "@/lib/access-allowlist";
import { requireCurrentSession } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validators/auth";

function getFieldErrors(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  return error.flatten().fieldErrors;
}

export async function signInAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
      message: "Fix the highlighted fields and try again.",
      status: "error",
    };
  }

  const normalizedEmail = normalizeEmail(parsed.data.email);
  const allowlistEntry = await getAllowlistEntryByEmail(normalizedEmail);

  if (!allowlistEntry || !allowlistEntry.is_active) {
    return {
      message: "That email is not approved for CaseFlow access. Contact your admin.",
      status: "error",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: parsed.data.password,
  });

  if (error) {
    return {
      message: "Could not sign in with that email and password.",
      status: "error",
    };
  }

  if (data.user) {
    try {
      await syncUserAccessFromAllowlist(data.user);
    } catch (syncError) {
      if (syncError instanceof AccessNotApprovedError) {
        await supabase.auth.signOut();

        return {
          message: "That email is not approved for CaseFlow access. Contact your admin.",
          status: "error",
        };
      }

      throw syncError;
    }
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
      message: "Fix the highlighted fields and try again.",
      status: "error",
    };
  }

  const normalizedEmail = normalizeEmail(parsed.data.email);
  const allowlistEntry = await getAllowlistEntryByEmail(normalizedEmail);

  if (!allowlistEntry || !allowlistEntry.is_active) {
    return {
      message: "That email is not approved for CaseFlow access. Contact your admin.",
      status: "error",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    return {
      message:
        error.message === "User already registered"
          ? "That email already has password access. Sign in instead."
          : "Could not create password access with that email.",
      status: "error",
    };
  }

  if (data.user) {
    await syncUserAccessFromAllowlist(data.user);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    message: "Password access created. Check your email if your organization requires confirmation before sign-in.",
    status: "success",
  };
}

export async function resetPasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getFieldErrors(parsed.error),
      message: "Fix the highlighted password fields and try again.",
      status: "error",
    };
  }

  const session = await requireCurrentSession();
  const { error: updateAuthError } = await session.supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (updateAuthError) {
    return {
      message: "We could not update the password. Try again.",
      status: "error",
    };
  }

  const { error: profileError } = await session.supabase
    .from("profiles")
    .update({
      must_reset_password: false,
    })
    .eq("id", session.profile.id);

  if (profileError) {
    return {
      message: "Your password changed, but we could not finish the account update. Sign in again if needed.",
      status: "error",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
