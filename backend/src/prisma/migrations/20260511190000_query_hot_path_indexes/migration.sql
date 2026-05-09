-- Hot-path lookups: tenant org resolution, tenant rent list, tenant maintenance list
CREATE INDEX "OrganizationMember_userId_orgRole_idx" ON "OrganizationMember" ("userId", "orgRole");
CREATE INDEX "RentInvoice_organizationId_tenantUserId_idx" ON "RentInvoice" ("organizationId", "tenantUserId");
CREATE INDEX "MaintenanceTicket_organizationId_tenantUserId_idx" ON "MaintenanceTicket" ("organizationId", "tenantUserId");
