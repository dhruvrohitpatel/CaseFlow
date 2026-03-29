import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button className="w-full justify-center sm:w-auto" size="sm" type="submit" variant="outline">
        <LogOut className="size-4" />
        Sign out
      </Button>
    </form>
  );
}
