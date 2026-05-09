import { OrgRole, UserRole } from "@prisma/client";
import type { Organization } from "@prisma/client";
import { notFound } from "../../common/httpErrors.js";
import { prisma } from "../../prisma/client.js";

export type MeProfile = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  role: UserRole;
  phoneVerified: boolean;
  lastLoginAt: Date | null;
  needsOwnerOnboarding: boolean;
  primaryOrganization: null | {
    id: string;
    name: string;
    city: string;
    addressLine1: string | null;
    addressLine2: string | null;
    locality: string | null;
    pincode: string | null;
    onboardingCompletedAt: Date | null;
    orgRole: OrgRole;
  };
  tenantProfile: null | {
    id: string;
    status: string;
    kycSubmittedAt: Date | null;
    moveInAt: Date | null;
    moveOutAt: Date | null;
  };
};

function mapOrg(org: Organization) {
  return {
    id: org.id,
    name: org.name,
    city: org.city,
    addressLine1: org.addressLine1,
    addressLine2: org.addressLine2,
    locality: org.locality,
    pincode: org.pincode,
    onboardingCompletedAt: org.onboardingCompletedAt,
  };
}

export class SessionService {
  async getMeProfile(userId: string): Promise<MeProfile> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        memberships: {
          where: { organization: { deletedAt: null } },
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw notFound("User not found");
    }

    const memberships = user.memberships;
    let primary: Organization | null = null;

    if (user.role === UserRole.OWNER) {
      const ownerMembership = memberships.find((m) => m.orgRole === OrgRole.OWNER);
      primary =
        ownerMembership?.organization ??
        memberships[0]?.organization ??
        null;
    } else if (user.role === UserRole.TENANT) {
      const tenantMembership = memberships.find((m) => m.orgRole === OrgRole.TENANT);
      primary =
        tenantMembership?.organization ?? memberships[0]?.organization ?? null;
    } else {
      primary = memberships[0]?.organization ?? null;
    }

    const needsOwnerOnboarding = Boolean(
      user.role === UserRole.OWNER &&
        primary &&
        !primary.onboardingCompletedAt,
    );

    const primaryMembership = primary
      ? memberships.find((m) => m.organizationId === primary.id)
      : undefined;

    let tenantProfile: MeProfile["tenantProfile"] = null;
    if (user.role === UserRole.TENANT && primary) {
      const t = await prisma.tenant.findFirst({
        where: {
          organizationId: primary.id,
          userId: user.id,
          deletedAt: null,
        },
        select: {
          id: true,
          status: true,
          kycSubmittedAt: true,
          moveInAt: true,
          moveOutAt: true,
        },
      });
      tenantProfile = t;
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      phoneVerified: user.phoneVerified,
      lastLoginAt: user.lastLoginAt,
      needsOwnerOnboarding,
      primaryOrganization: primary
        ? {
            ...mapOrg(primary),
            orgRole: primaryMembership?.orgRole ?? OrgRole.STAFF,
          }
        : null,
      tenantProfile,
    };
  }
}
