export type PrimaryOrganization = {
  id: string;
  name: string;
  city: string;
  addressLine1: string | null;
  addressLine2: string | null;
  locality: string | null;
  pincode: string | null;
  onboardingCompletedAt: string | null;
  /** Role in this organization (from membership). */
  orgRole: "OWNER" | "MANAGER" | "STAFF" | "TENANT";
};

export type TenantProfileSummary = {
  id: string;
  status: string;
  kycSubmittedAt: string | null;
  moveInAt: string | null;
  moveOutAt: string | null;
};

export type SessionProfile = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  role: string;
  phoneVerified: boolean;
  lastLoginAt?: string | null;
  needsOwnerOnboarding: boolean;
  primaryOrganization: PrimaryOrganization | null;
  tenantProfile?: TenantProfileSummary | null;
};
