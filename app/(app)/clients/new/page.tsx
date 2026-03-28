import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CreateClientForm } from "@/components/forms/create-client-form";
import { requireRole } from "@/lib/auth";

const outlineLinkClassName =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100";

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
        <Link className={outlineLinkClassName} href="/clients">
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
      </div>
      <CreateClientForm />
    </div>
  );
}
