import type { Request, Response } from "express";
import type {
  OwnerReviewDocumentInput,
  OwnerUpdateTenantInput,
} from "@pg-manager/shared";
import { ownerTenantListQueryDto, paginationQueryDto } from "@pg-manager/shared";
import { badRequest } from "../../common/httpErrors.js";
import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { TenantService } from "./tenant.service.js";

const tenantService = new TenantService();

export const listOrgTenants = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const parsed = ownerTenantListQueryDto.safeParse(req.query);
  if (!parsed.success) {
    throw badRequest("Validation failed", parsed.error.flatten());
  }
  const data = await tenantService.listTenantsForOwner(orgId!, parsed.data);
  sendSuccess(res, data);
});

export const getOrgTenantDetail = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const { tenantId } = req.params;
  const data = await tenantService.getTenantForOwner(orgId!, tenantId!);
  sendSuccess(res, data);
});

export const patchOrgTenant = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const { tenantId } = req.params;
  const body = req.body as OwnerUpdateTenantInput;
  const data = await tenantService.updateTenantByOwner(
    orgId!,
    tenantId!,
    req.auth!.userId,
    body,
  );
  sendSuccess(res, data);
});

export const getOrgTenantDocumentSignedUrl = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = req.params.orgId;
    const { documentId } = req.params;
    const data = await tenantService.ownerDocumentSignedUrl(orgId!, documentId!);
    sendSuccess(res, data);
  },
);

export const patchOrgTenantDocumentReview = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = req.params.orgId;
    const { documentId } = req.params;
    const body = req.body as OwnerReviewDocumentInput;
    const row = await tenantService.ownerReviewDocument(
      orgId!,
      documentId!,
      req.auth!.userId,
      body,
    );
    sendSuccess(res, row);
  },
);

export const getOrgTenantHistory = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const { tenantId } = req.params;
  const parsed = paginationQueryDto.safeParse(req.query);
  if (!parsed.success) {
    throw badRequest("Validation failed", parsed.error.flatten());
  }
  const data = await tenantService.listTenantHistoryForOwner(
    orgId!,
    tenantId!,
    parsed.data.page,
    parsed.data.pageSize,
  );
  sendSuccess(res, data);
});
