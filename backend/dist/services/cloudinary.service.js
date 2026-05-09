import { v2 as cloudinary } from "cloudinary";
import { badRequest } from "../common/httpErrors.js";
import { loadEnv } from "../config/env.js";
let configured = false;
function ensureConfigured() {
    if (configured)
        return;
    const env = loadEnv();
    cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
    });
    configured = true;
}
function sanitizeFilename(name) {
    return name.replace(/[^\w.-]+/g, "_").slice(0, 80);
}
/**
 * Uploads a binary to Cloudinary as an authenticated asset (no public delivery).
 * Callers must persist `publicId` + `resourceType` and only expose time-limited signed URLs.
 */
export async function uploadAuthenticatedDocument(params) {
    ensureConfigured();
    const folder = `pg-manager/tenant-docs/${params.organizationId}/${params.tenantId}`;
    const dataUri = `data:${params.mimeType};base64,${params.buffer.toString("base64")}`;
    const useRaw = params.mimeType === "application/pdf";
    const res = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: useRaw ? "raw" : "auto",
        type: "authenticated",
        use_filename: true,
        unique_filename: true,
        filename_override: sanitizeFilename(params.originalFilename),
    });
    return {
        publicId: res.public_id,
        resourceType: res.resource_type === "raw" ? "raw" : "image",
        bytes: res.bytes ?? params.buffer.length,
    };
}
export function signedAuthenticatedUrl(publicId, resourceType) {
    ensureConfigured();
    return cloudinary.url(publicId, {
        type: "authenticated",
        sign_url: true,
        resource_type: resourceType === "raw" ? "raw" : "image",
        secure: true,
    });
}
const MAINTENANCE_PHOTO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
/**
 * Maintenance ticket photos (images only), authenticated delivery.
 */
export async function uploadMaintenanceTicketPhoto(params) {
    if (!MAINTENANCE_PHOTO_MIME.has(params.mimeType)) {
        throw badRequest("Maintenance photos must be JPEG, PNG, or WebP");
    }
    if (params.buffer.length <= 0 || params.buffer.length > 5 * 1024 * 1024) {
        throw badRequest("Photo must be between 1 byte and 5 MB");
    }
    ensureConfigured();
    const folder = `pg-manager/maintenance/${params.organizationId}/${params.ticketId}`;
    const dataUri = `data:${params.mimeType};base64,${params.buffer.toString("base64")}`;
    const res = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: "image",
        type: "authenticated",
        use_filename: true,
        unique_filename: true,
        filename_override: sanitizeFilename(params.originalFilename),
    });
    return {
        publicId: res.public_id,
        resourceType: "image",
        bytes: res.bytes ?? params.buffer.length,
    };
}
export async function destroyAuthenticatedDocument(publicId, resourceType) {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId, {
        type: "authenticated",
        resource_type: resourceType === "raw" ? "raw" : "image",
        invalidate: true,
    });
}
//# sourceMappingURL=cloudinary.service.js.map