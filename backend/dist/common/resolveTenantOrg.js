import { OrgRole } from "@prisma/client";
import { forbidden } from "./httpErrors.js";
import { prisma } from "../prisma/client.js";
/** Primary tenant org membership (first created) — used by tenant portal modules. */
export async function resolveTenantOrganizationId(userId) {
    const m = await prisma.organizationMember.findFirst({
        where: { userId, orgRole: OrgRole.TENANT, organization: { deletedAt: null } },
        orderBy: { createdAt: "asc" },
        select: { organizationId: true },
    });
    if (!m)
        throw forbidden("No tenant membership");
    return m.organizationId;
}
//# sourceMappingURL=resolveTenantOrg.js.map