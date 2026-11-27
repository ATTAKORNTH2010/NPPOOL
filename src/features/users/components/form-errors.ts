import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "@/lib/action-result";

/** Puts server-side field errors back under the matching inputs. */
export function applyFieldErrors<T extends FieldValues>(result: ActionResult, setError: UseFormSetError<T>) {
  if (result.ok || !result.fieldErrors) return;
  for (const [field, messages] of Object.entries(result.fieldErrors)) {
    if (messages[0]) setError(field as Path<T>, { type: "server", message: messages[0] });
  }
}
