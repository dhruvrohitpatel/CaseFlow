import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CreateClientForm } from "@/components/forms/create-client-form";
import { requireRole } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function NewClientPage() {
  await requireRole(["admin", "staff"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">New client</h1>
          <p className="mt-2 text-sm text-stone-600">
            Create a client record with core contact and demographic details.
          </p>
        </div>
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
          href="/clients"
        >
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
      </div>
      <CreateClientForm />
    </div>
  );
}
