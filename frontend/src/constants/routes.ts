export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  owner: "/owner",
  ownerProperty: "/owner/property",
  ownerVacancy: "/owner/vacancy",
  ownerOnboarding: "/owner/onboarding",
  tenant: "/tenant",
  tenantOnboarding: "/tenant/onboarding",
  tenantProfile: "/tenant/profile",
  tenantDocuments: "/tenant/documents",
  tenantHistory: "/tenant/history",
  ownerTenants: "/owner/tenants",
  ownerMore: "/owner/more",
  ownerRent: "/owner/rent",
  tenantRent: "/tenant/rent",
  ownerMaintenance: "/owner/maintenance",
  tenantMaintenance: "/tenant/maintenance",
  tenantMaintenanceNew: "/tenant/maintenance/new",
  tenantNotices: "/tenant/notices",
} as const;

export function joinInvitePath(token: string) {
  return `/join/${token}`;
}

