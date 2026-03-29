"use client";

import { useActionState, useState } from "react";
import zxcvbn from "zxcvbn";

import { signUpAction } from "@/app/actions/auth";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/lib/actions/form-state";

const STRENGTH_LABELS = ["Too weak", "Too weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "bg-red-400",
  "bg-red-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-emerald-500",
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const result = zxcvbn(password);
  const score = result.score; // 0–4
  const label = STRENGTH_LABELS[score];
  const color = STRENGTH_COLORS[score];
  const suggestions = [
    result.feedback.warning,
    ...result.feedback.suggestions,
  ].filter(Boolean);

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < score + 1 ? color : "bg-stone-200"
            }`}
          />
        ))}
      </div>
      {/* Score label */}
      <p className={`text-xs font-medium ${
        score <= 1 ? "text-red-600" : score === 2 ? "text-amber-600" : "text-emerald-600"
      }`}>
        {label}
      </p>
      {/* zxcvbn suggestions */}
      {suggestions.length > 0 && score < 3 ? (
        <ul className="space-y-0.5">
          {suggestions.map((s, i) => (
            <li key={i} className="text-xs text-stone-500">
              {s}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialActionState);

  // Persist field values across failed submissions
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle>Set up password access</CardTitle>
        <CardDescription>
          If your approved email cannot use Google, create a password login here. Your role still comes from the organization access list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full name</Label>
            <Input
              id="signup-name"
              name="fullName"
              placeholder="Jamie Rivera"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {state.fieldErrors?.fullName ? (
              <p className="text-sm text-red-700">{state.fieldErrors.fullName[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              name="email"
              placeholder="jamie@nonprofit.org"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-red-700">{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              name="password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* Requirements hint shown before typing */}
            {!password ? (
              <p className="text-xs text-stone-500">
                At least 8 characters. Avoid common words or keyboard patterns.
              </p>
            ) : (
              <PasswordStrengthIndicator password={password} />
            )}
            {state.fieldErrors?.password ? (
              <p className="text-sm text-red-700">{state.fieldErrors.password[0]}</p>
            ) : null}
          </div>

          <FormMessage message={state.message} />
          <SubmitButton pendingLabel="Creating access...">Create password access</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
