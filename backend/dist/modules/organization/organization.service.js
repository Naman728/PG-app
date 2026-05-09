import { notFound } from "../../common/httpErrors.js";
import { prisma } from "../../prisma/client.js";
export class OrganizationService {
    async updateProfile(organizationId, input) {
        const exists = await prisma.organization.findFirst({
            where: { id: organizationId, deletedAt: null },
        });
        if (!exists) {
            throw notFound("Organization not found");
        }
        const data = {};
        if (input.name !== undefined)
            data.name = input.name;
        if (input.city !== undefined)
            data.city = input.city;
        if (input.addressLine1 !== undefined)
            data.addressLine1 = input.addressLine1;
        if (input.addressLine2 !== undefined)
            data.addressLine2 = input.addressLine2;
        if (input.locality !== undefined)
            data.locality = input.locality;
        if (input.pincode !== undefined)
            data.pincode = input.pincode;
        if (input.completeOnboarding) {
            data.onboardingCompletedAt = new Date();
        }
        return prisma.organization.update({
            where: { id: organizationId, deletedAt: null },
            data,
        });
    }
}
//# sourceMappingURL=organization.service.js.map