"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  disabled = false,
  pendingLabel = "Saving...",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || disabled} type="submit">
      {pending ? pendingLabel : children}
    </Button>
  );
}
