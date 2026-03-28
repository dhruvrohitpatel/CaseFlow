import { updateClientStatusAction } from "@/app/actions/clients";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/database.types";

type ClientStatusFormProps = {
  clientPublicId: string;
  status: Database["public"]["Enums"]["client_status"];
};

const nativeSelectClassName =
  "flex h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

export function ClientStatusForm({
  clientPublicId,
  status,
}: ClientStatusFormProps) {
  return (
    <form action={updateClientStatusAction} className="flex flex-wrap items-center gap-2">
      <input name="clientPublicId" type="hidden" value={clientPublicId} />
      <select className={nativeSelectClassName} defaultValue={status} name="status">
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="archived">Archived</option>
      </select>
      <Button type="submit" variant="outline">
        Update status
      </Button>
    </form>
  );
}
