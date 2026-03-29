import { getCustomFieldInputName, getSelectOptions, type CustomFieldDefinition } from "@/lib/custom-fields";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DynamicFieldsProps = {
  confidenceByDefinitionId?: Record<string, string>;
  definitions: CustomFieldDefinition[];
  fieldErrors?: Record<string, string[] | undefined>;
  initialValues?: Record<string, string>;
};

const nativeSelectClassName =
  "flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors focus:border-stone-400";

export function DynamicFields({
  confidenceByDefinitionId,
  definitions,
  fieldErrors,
  initialValues,
}: DynamicFieldsProps) {
  if (definitions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 md:col-span-2">
      <div>
        <h3 className="text-base font-semibold text-stone-950">Custom fields</h3>
        <p className="mt-1 text-sm text-stone-600">
          These fields are managed by admins and appear wherever this record type is edited.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {definitions.map((definition) => {
          const inputName = getCustomFieldInputName(definition.id);
          const error = fieldErrors?.[inputName]?.[0];
          const defaultValue = initialValues?.[definition.id] ?? "";
          const confidence = confidenceByDefinitionId?.[definition.id];
          const selectOptions = getSelectOptions(definition.select_options);
          const hasUnexpectedSelectValue =
            definition.field_type === "select" && defaultValue && !selectOptions.includes(defaultValue);

          return (
            <div
              key={definition.id}
              className={definition.field_type === "textarea" ? "space-y-2 md:col-span-2" : "space-y-2"}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor={inputName}>
                  {definition.label}
                  {definition.is_required ? <span className="text-stone-500"> *</span> : null}
                </Label>
                {confidence === "low" ? (
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Low confidence
                  </span>
                ) : confidence === "medium" ? (
                  <span className="rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                    Review suggested
                  </span>
                ) : null}
              </div>
              {definition.field_type === "textarea" ? (
                <Textarea
                  defaultValue={defaultValue}
                  id={inputName}
                  name={inputName}
                  rows={4}
                />
              ) : definition.field_type === "select" ? (
                <select
                  className={nativeSelectClassName}
                  defaultValue={defaultValue}
                  id={inputName}
                  name={inputName}
                >
                  <option value="">Select an option</option>
                  {hasUnexpectedSelectValue ? (
                    <option value={defaultValue}>{defaultValue}</option>
                  ) : null}
                  {selectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  defaultValue={defaultValue}
                  id={inputName}
                  name={inputName}
                  type={definition.field_type === "date" ? "date" : definition.field_type === "number" ? "number" : "text"}
                />
              )}
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
