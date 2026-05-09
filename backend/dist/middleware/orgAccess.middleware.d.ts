import type { OrgRole } from "@prisma/client";
/**
 * Requires membership in `:orgId` with one of the allowed org roles.
 * Must run after `requireAuth`.
 */
export declare function requireOrgRoles(...allowed: OrgRole[]): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
