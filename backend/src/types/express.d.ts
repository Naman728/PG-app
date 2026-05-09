import type { OrganizationMember, UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Locals {
      requestId?: string;
    }

    interface Request {
      auth?: { userId: string; role: UserRole };
      organizationMember?: OrganizationMember;
    }
  }
}

export {};
