export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  fieldErrors?: FieldErrors;
  message?: string;
  status?: "error" | "success";
};

export const initialActionState: ActionState = {};
