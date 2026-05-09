import type {
  TenantDocumentCategory,
  TenantDocumentReviewStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import {
  maskAadhaarLast4,
  type CreateEmergencyContactInput,
  type OwnerReviewDocumentInput,
  type OwnerTenantListQuery,
  type OwnerUpdateTenantInput,
  type UpdateEmergencyContactInput,
  type UpdateTenantProfileInput,
} from "@pg-manager/shared";
import {
  badRequest,
  forbidden,
  notFound,
} from "../../common/httpErrors.js";
import { prisma } from "../../prisma/client.js";
import {
  destroyAuthenticatedDocument,
  signedAuthenticatedUrl,
  uploadAuthenticatedDocument,
} from "../../services/cloudinary.service.js";
import { assertTenantUploadAllowed } from "./tenant-upload.validation.js";
import { TenantRepository, type TenantListQuery } from "./tenant.repository.js";

export class TenantService {
  constructor(private readonly repo = new TenantRepository()) {}

  private async resolveTenantContext(userId: string) {
    const membership = await this.repo.findMembershipTenantOrg(userId);
    if (!membership) {
      throw forbidden("No tenant membership found");
    }
    const tenant = await this.repo.upsertTenantOnboarding(
      membership.organizationId,
      userId,
    );
    return {
      organizationId: membership.organizationId,
      tenant,
    };
  }

  async getMyProfile(userId: string) {
    const { organizationId, tenant } = await this.resolveTenantContext(userId);
    const bed = await this.repo.findBedAssignment(organizationId, userId);
    return {
      tenant: {
        id: tenant.id,
        status: tenant.status,
        moveInAt: tenant.moveInAt,
        moveOutAt: tenant.moveOutAt,
        aadhaarMasked: maskAadhaarLast4(tenant.aadhaarLast4),
        dateOfBirth: tenant.dateOfBirth,
        occupation: tenant.occupation,
        permanentAddress: tenant.permanentAddress,
        kycSubmittedAt: tenant.kycSubmittedAt,
        onboardedAt: tenant.onboardedAt,
        statusNote: tenant.statusNote,
      },
      user: tenant.user,
      documents: tenant.documents.map((d) => ({
        id: d.id,
        category: d.category,
        reviewStatus: d.reviewStatus,
        originalFilename: d.originalFilename,
        mimeType: d.mimeType,
        byteSize: d.byteSize,
        reviewNote: d.reviewNote,
        reviewedAt: d.reviewedAt,
        createdAt: d.createdAt,
      })),
      emergencyContacts: tenant.emergencyContacts,
      bedAssignment: bed
        ? {
            bedId: bed.id,
            label: bed.label,
            monthlyRentMinor: bed.monthlyRentMinor,
            room: { id: bed.room.id, name: bed.room.name },
            floor: bed.room.floor,
          }
        : null,
    };
  }

  async updateMyProfile(userId: string, input: UpdateTenantProfileInput) {
    const { tenant } = await this.resolveTenantContext(userId);
    if (
      tenant.status !== "ONBOARDING" &&
      tenant.status !== "PENDING_REVIEW" &&
      tenant.status !== "ACTIVE"
    ) {
      throw badRequest("Profile cannot be edited in the current status");
    }
    if (tenant.status === "PENDING_REVIEW") {
      const touch =
        input.name !== undefined ||
        input.dateOfBirth !== undefined ||
        input.occupation !== undefined ||
        input.permanentAddress !== undefined ||
        input.aadhaarLast4 !== undefined;
      if (touch) {
        throw badRequest("KYC is under review; profile fields are locked");
      }
    }

    await prisma.$transaction(async (tx) => {
      if (input.name !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { name: input.name },
        });
      }
      await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          dateOfBirth:
            input.dateOfBirth === undefined
              ? undefined
              : input.dateOfBirth
                ? new Date(
                    input.dateOfBirth.includes("T")
                      ? input.dateOfBirth
                      : `${input.dateOfBirth}T12:00:00.000Z`,
                  )
                : null,
          occupation: input.occupation,
          permanentAddress: input.permanentAddress,
          aadhaarLast4:
            input.aadhaarLast4 === undefined
              ? undefined
              : input.aadhaarLast4 ?? null,
        },
      });
    });

    return this.getMyProfile(userId);
  }

  async submitMyKyc(userId: string) {
    const { organizationId, tenant } = await this.resolveTenantContext(userId);
    if (tenant.status !== "ONBOARDING") {
      throw badRequest("KYC can only be submitted from onboarding");
    }
    if (!tenant.aadhaarLast4 || tenant.aadhaarLast4.length !== 4) {
      throw badRequest("Add the last 4 digits of your Aadhaar before submitting");
    }
    const ec = await this.repo.countEmergencyContacts(tenant.id);
    if (ec < 1) {
      throw badRequest("Add at least one emergency contact");
    }
    const docs = await this.repo.countDocumentsByTenant(tenant.id);
    if (docs < 1) {
      throw badRequest("Upload at least one identity document");
    }
    const front = await this.repo.hasCategory(tenant.id, "AADHAAR_FRONT");
    const back = await this.repo.hasCategory(tenant.id, "AADHAAR_BACK");
    if (!front || !back) {
      throw badRequest("Upload both Aadhaar front and Aadhaar back images or PDFs");
    }

    const updated = await this.repo.updateTenant(tenant.id, {
      status: "PENDING_REVIEW",
      kycSubmittedAt: new Date(),
    });

    await this.repo.appendHistory({
      organization: { connect: { id: organizationId } },
      tenant: { connect: { id: userId } },
      eventType: "KYC_SUBMITTED",
      payload: { tenantRecordId: tenant.id },
    });

    return { ok: true, status: updated.status, kycSubmittedAt: updated.kycSubmittedAt };
  }

  async uploadMyDocument(
    userId: string,
    category: TenantDocumentCategory,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  ) {
    const { organizationId, tenant } = await this.resolveTenantContext(userId);
    if (tenant.status !== "ONBOARDING") {
      throw badRequest("Documents can only be uploaded during onboarding");
    }
    assertTenantUploadAllowed(file.mimetype, file.size);

    const uploaded = await uploadAuthenticatedDocument({
      organizationId,
      tenantId: tenant.id,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalFilename: file.originalname,
    });

    const doc = await this.repo.createDocument({
      tenant: { connect: { id: tenant.id } },
      organization: { connect: { id: organizationId } },
      category,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      byteSize: uploaded.bytes,
      cloudinaryPublicId: uploaded.publicId,
      resourceType: uploaded.resourceType,
    });

    await this.repo.appendHistory({
      organization: { connect: { id: organizationId } },
      tenant: { connect: { id: userId } },
      eventType: "DOCUMENT_UPLOADED",
      payload: {
        documentId: doc.id,
        category,
      },
    });

    return {
      id: doc.id,
      category: doc.category,
      reviewStatus: doc.reviewStatus,
      originalFilename: doc.originalFilename,
      createdAt: doc.createdAt,
    };
  }

  async deleteMyDocument(userId: string, documentId: string) {
    const { organizationId, tenant } = await this.resolveTenantContext(userId);
    if (tenant.status !== "ONBOARDING") {
      throw badRequest("Documents cannot be removed after onboarding");
    }
    const doc = await this.repo.findDocumentForTenant(documentId, tenant.id);
    if (!doc?.tenant) throw notFound("Document not found");
    try {
      await destroyAuthenticatedDocument(
        doc.cloudinaryPublicId,
        doc.resourceType === "raw" ? "raw" : "image",
      );
    } catch {
      // Cloudinary may already have removed the asset; continue with DB soft-delete.
    }
    await this.repo.softDeleteDocument(doc.id);
    await this.repo.appendHistory({
      organization: { connect: { id: organizationId } },
      tenant: { connect: { id: doc.tenant.userId } },
      eventType: "DOCUMENT_DELETED",
      payload: { documentId: doc.id },
    });
    return { ok: true };
  }

  async getMyDocumentSignedUrl(userId: string, documentId: string) {
    const { tenant } = await this.resolveTenantContext(userId);
    const doc = await this.repo.findDocumentForTenant(documentId, tenant.id);
    if (!doc) throw notFound("Document not found");
    const url = signedAuthenticatedUrl(
      doc.cloudinaryPublicId,
      doc.resourceType === "raw" ? "raw" : "image",
    );
    return { url, expiresInSec: 300 };
  }

  async listMyEmergencyContacts(userId: string) {
    const { tenant } = await this.resolveTenantContext(userId);
    return tenant.emergencyContacts;
  }

  async createMyEmergencyContact(userId: string, input: CreateEmergencyContactInput) {
    const { organizationId, tenant } = await this.resolveTenantContext(userId);
    if (tenant.status !== "ONBOARDING" && tenant.status !== "PENDING_REVIEW") {
      throw badRequest("Emergency contacts are locked for your current status");
    }
    if (tenant.status === "PENDING_REVIEW") {
      throw badRequest("KYC is under review; emergency contacts are locked");
    }
    if (input.isPrimary) {
      await prisma.tenantEmergencyContact.updateMany({
        where: { tenantId: tenant.id, deletedAt: null },
        data: { isPrimary: false },
      });
    }
    const row = await this.repo.createEmergencyContact({
      tenant: { connect: { id: tenant.id } },
      name: input.name,
      phone: input.phone,
      relation: input.relation,
      isPrimary: input.isPrimary ?? false,
    });
    await this.repo.appendHistory({
      organization: { connect: { id: organizationId } },
      tenant: { connect: { id: userId } },
      eventType: "EMERGENCY_CONTACT_ADDED",
      payload: { contactId: row.id },
    });
    return row;
  }

  async updateMyEmergencyContact(
    userId: string,
    contactId: string,
    input: UpdateEmergencyContactInput,
  ) {
    const { organizationId, tenant } = await this.resolveTenantContext(userId);
    if (tenant.status !== "ONBOARDING") {
      throw badRequest("Emergency contacts cannot be edited now");
    }
    const row = await this.repo.findEmergencyContact(contactId, tenant.id);
    if (!row) throw notFound("Contact not found");
    if (input.isPrimary) {
      await prisma.tenantEmergencyContact.updateMany({
        where: { tenantId: tenant.id, deletedAt: null, NOT: { id: contactId } },
        data: { isPrimary: false },
      });
    }
    const updated = await this.repo.updateEmergencyContact(contactId, input);
    await this.repo.appendHistory({
      organization: { connect: { id: organizationId } },
      tenant: { connect: { id: userId } },
      eventType: "EMERGENCY_CONTACT_UPDATED",
      payload: { contactId },
    });
    return updated;
  }

  async deleteMyEmergencyContact(userId: string, contactId: string) {
    const { organizationId, tenant } = await this.resolveTenantContext(userId);
    if (tenant.status !== "ONBOARDING") {
      throw badRequest("Emergency contacts cannot be deleted now");
    }
    const row = await this.repo.findEmergencyContact(contactId, tenant.id);
    if (!row) throw notFound("Contact not found");
    await this.repo.softDeleteEmergencyContact(contactId);
    await this.repo.appendHistory({
      organization: { connect: { id: organizationId } },
      tenant: { connect: { id: userId } },
      eventType: "EMERGENCY_CONTACT_REMOVED",
      payload: { contactId },
    });
    return { ok: true };
  }

  async listMyHistory(userId: string, page: number, pageSize: number) {
    const { organizationId } = await this.resolveTenantContext(userId);
    const take = Math.min(50, Math.max(1, pageSize));
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await Promise.all([
      this.repo.listHistory(organizationId, userId, take, skip),
      this.repo.countHistory(organizationId, userId),
    ]);
    return {
      items: items.map((h) => ({
        id: h.id,
        eventType: h.eventType,
        payload: h.payload,
        createdAt: h.createdAt,
        createdBy: h.createdBy,
      })),
      page,
      pageSize: take,
      total,
    };
  }

  async listTenantsForOwner(organizationId: string, query: OwnerTenantListQuery) {
    const listQuery: TenantListQuery = {
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      q: query.q,
    };
    const { items, total } = await this.repo.listTenantsForOrg(organizationId, listQuery);
    return {
      items: items.map((t) => ({
        id: t.id,
        status: t.status,
        moveInAt: t.moveInAt,
        moveOutAt: t.moveOutAt,
        kycSubmittedAt: t.kycSubmittedAt,
        onboardedAt: t.onboardedAt,
        user: t.user,
        aadhaarMasked: maskAadhaarLast4(t.aadhaarLast4),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getTenantForOwner(organizationId: string, tenantId: string) {
    const row = await this.repo.findTenantByIdForOrg(tenantId, organizationId);
    if (!row) throw notFound("Tenant not found");
    const bed = await this.repo.findBedAssignment(organizationId, row.userId);
    return {
      tenant: {
        id: row.id,
        status: row.status,
        moveInAt: row.moveInAt,
        moveOutAt: row.moveOutAt,
        aadhaarMasked: maskAadhaarLast4(row.aadhaarLast4),
        dateOfBirth: row.dateOfBirth,
        occupation: row.occupation,
        permanentAddress: row.permanentAddress,
        kycSubmittedAt: row.kycSubmittedAt,
        onboardedAt: row.onboardedAt,
        statusNote: row.statusNote,
      },
      user: row.user,
      documents: row.documents.map((d) => ({
        id: d.id,
        category: d.category,
        reviewStatus: d.reviewStatus,
        originalFilename: d.originalFilename,
        mimeType: d.mimeType,
        byteSize: d.byteSize,
        reviewNote: d.reviewNote,
        reviewedAt: d.reviewedAt,
        createdAt: d.createdAt,
      })),
      emergencyContacts: row.emergencyContacts,
      bedAssignment: bed
        ? {
            bedId: bed.id,
            label: bed.label,
            monthlyRentMinor: bed.monthlyRentMinor,
            room: { id: bed.room.id, name: bed.room.name },
            floor: bed.room.floor,
          }
        : null,
    };
  }

  async updateTenantByOwner(
    organizationId: string,
    tenantId: string,
    actorUserId: string,
    input: OwnerUpdateTenantInput,
  ) {
    const row = await this.repo.findTenantByIdForOrg(tenantId, organizationId);
    if (!row) throw notFound("Tenant not found");

    const data: Prisma.TenantUpdateInput = {
      status: input.status,
    };
    if (input.statusNote !== undefined) {
      data.statusNote = input.statusNote;
    }
    if (input.moveInAt !== undefined) {
      data.moveInAt = input.moveInAt
        ? new Date(
            input.moveInAt.includes("T")
              ? input.moveInAt
              : `${input.moveInAt}T12:00:00.000Z`,
          )
        : null;
    }
    if (input.moveOutAt !== undefined) {
      data.moveOutAt = input.moveOutAt
        ? new Date(
            input.moveOutAt.includes("T")
              ? input.moveOutAt
              : `${input.moveOutAt}T12:00:00.000Z`,
          )
        : null;
    }
    if (input.status === "ACTIVE" && row.status !== "ACTIVE") {
      data.onboardedAt = new Date();
      const nextMoveIn =
        input.moveInAt !== undefined
          ? input.moveInAt
            ? new Date(input.moveInAt)
            : null
          : row.moveInAt;
      if (!nextMoveIn) {
        data.moveInAt = new Date();
      }
    }
    if (input.status === "ONBOARDING") {
      data.kycSubmittedAt = null;
    }

    await this.repo.updateTenant(tenantId, data);

    await this.repo.appendHistory({
      organization: { connect: { id: organizationId } },
      tenant: { connect: { id: row.userId } },
      eventType: "TENANT_STATUS_UPDATED",
      payload: {
        from: row.status,
        to: input.status,
        tenantRecordId: tenantId,
      },
      createdBy: { connect: { id: actorUserId } },
    });

    return this.getTenantForOwner(organizationId, tenantId);
  }

  async ownerDocumentSignedUrl(organizationId: string, documentId: string) {
    const doc = await this.repo.findDocumentForOrg(documentId, organizationId);
    if (!doc) throw notFound("Document not found");
    const url = signedAuthenticatedUrl(
      doc.cloudinaryPublicId,
      doc.resourceType === "raw" ? "raw" : "image",
    );
    return { url, expiresInSec: 300 };
  }

  async ownerReviewDocument(
    organizationId: string,
    documentId: string,
    actorUserId: string,
    input: OwnerReviewDocumentInput,
  ) {
    const doc = await this.repo.findDocumentForOrg(documentId, organizationId);
    if (!doc?.tenant) throw notFound("Document not found");
    const status = input.reviewStatus as TenantDocumentReviewStatus;
    const updated = await this.repo.updateDocument(documentId, {
      reviewStatus: status,
      reviewNote: input.reviewNote ?? null,
      reviewedAt: new Date(),
      reviewedBy: { connect: { id: actorUserId } },
    });
    await this.repo.appendHistory({
      organization: { connect: { id: organizationId } },
      tenant: { connect: { id: doc.tenant.userId } },
      eventType: "DOCUMENT_REVIEWED",
      payload: { documentId, status, note: input.reviewNote },
      createdBy: { connect: { id: actorUserId } },
    });
    return updated;
  }

  async listTenantHistoryForOwner(
    organizationId: string,
    tenantRecordId: string,
    page: number,
    pageSize: number,
  ) {
    const row = await this.repo.findTenantByIdForOrg(tenantRecordId, organizationId);
    if (!row) throw notFound("Tenant not found");
    const take = Math.min(50, Math.max(1, pageSize));
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await Promise.all([
      this.repo.listHistory(organizationId, row.userId, take, skip),
      this.repo.countHistory(organizationId, row.userId),
    ]);
    return {
      items: items.map((h) => ({
        id: h.id,
        eventType: h.eventType,
        payload: h.payload,
        createdAt: h.createdAt,
        createdBy: h.createdBy,
      })),
      page,
      pageSize: take,
      total,
    };
  }
}
