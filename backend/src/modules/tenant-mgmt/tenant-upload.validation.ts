import { badRequest } from "../../common/httpErrors.js";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export function assertTenantUploadAllowed(mimeType: string, byteSize: number) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw badRequest("Only JPEG, PNG, WebP, or PDF uploads are allowed");
  }
  if (byteSize <= 0 || byteSize > MAX_BYTES) {
    throw badRequest("File must be between 1 byte and 5 MB");
  }
}
