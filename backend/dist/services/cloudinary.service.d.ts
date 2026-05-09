/**
 * Uploads a binary to Cloudinary as an authenticated asset (no public delivery).
 * Callers must persist `publicId` + `resourceType` and only expose time-limited signed URLs.
 */
export declare function uploadAuthenticatedDocument(params: {
    organizationId: string;
    tenantId: string;
    buffer: Buffer;
    mimeType: string;
    originalFilename: string;
}): Promise<{
    publicId: string;
    resourceType: "image" | "raw";
    bytes: number;
}>;
export declare function signedAuthenticatedUrl(publicId: string, resourceType: "image" | "raw"): string;
/**
 * Maintenance ticket photos (images only), authenticated delivery.
 */
export declare function uploadMaintenanceTicketPhoto(params: {
    organizationId: string;
    ticketId: string;
    buffer: Buffer;
    mimeType: string;
    originalFilename: string;
}): Promise<{
    publicId: string;
    resourceType: "image";
    bytes: number;
}>;
export declare function destroyAuthenticatedDocument(publicId: string, resourceType: "image" | "raw"): Promise<void>;
