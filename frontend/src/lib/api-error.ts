/** Turn API validation `details` (e.g. Zod flatten) into a short readable string. */
export function formatApiErrorDetails(details: unknown): string {
  if (details == null || typeof details !== "object") return "";
  const d = details as {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | string[][] | unknown>;
  };
  const parts: string[] = [];
  if (Array.isArray(d.formErrors)) {
    for (const e of d.formErrors) {
      if (typeof e === "string" && e.trim()) parts.push(e.trim());
    }
  }
  if (d.fieldErrors && typeof d.fieldErrors === "object") {
    for (const [key, val] of Object.entries(d.fieldErrors)) {
      if (Array.isArray(val) && val.length) {
        const msgs = val.flat().filter((x): x is string => typeof x === "string" && x.length > 0);
        if (msgs.length) parts.push(`${key}: ${msgs.join(", ")}`);
      }
    }
  }
  return parts.length ? ` — ${parts.join(" · ")}` : "";
}
