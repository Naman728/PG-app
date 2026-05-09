import type { Request, Response } from "express";
import type {
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
  UpdateTenantProfileInput,
} from "@pg-manager/shared";
import { uploadDocumentMetaDto } from "@pg-manager/shared";
import { badRequest } from "../../common/httpErrors.js";
import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { TenantService } from "./tenant.service.js";

const tenantService = new TenantService();

export const getMyTenantProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await tenantService.getMyProfile(req.auth!.userId);
  sendSuccess(res, data);
});

export const patchMyTenantProfile = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateTenantProfileInput;
  const data = await tenantService.updateMyProfile(req.auth!.userId, body);
  sendSuccess(res, data);
});

export const postMyKycSubmit = asyncHandler(async (req: Request, res: Response) => {
  const data = await tenantService.submitMyKyc(req.auth!.userId);
  sendSuccess(res, data);
});

export const postMyDocument = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file?.buffer) {
    throw badRequest("Missing file upload (field name: file)");
  }
  const parsed = uploadDocumentMetaDto.safeParse({
    category: (req.body as { category?: string }).category,
  });
  if (!parsed.success) {
    throw badRequest("Validation failed", parsed.error.flatten());
  }
  const data = await tenantService.uploadMyDocument(
    req.auth!.userId,
    parsed.data.category,
    {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    },
  );
  sendSuccess(res, data);
});

export const deleteMyDocument = asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const data = await tenantService.deleteMyDocument(req.auth!.userId, documentId!);
  sendSuccess(res, data);
});

export const getMyDocumentSignedUrl = asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const data = await tenantService.getMyDocumentSignedUrl(req.auth!.userId, documentId!);
  sendSuccess(res, data);
});

export const getMyEmergencyContacts = asyncHandler(async (req: Request, res: Response) => {
  const rows = await tenantService.listMyEmergencyContacts(req.auth!.userId);
  sendSuccess(res, { contacts: rows });
});

export const postMyEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateEmergencyContactInput;
  const row = await tenantService.createMyEmergencyContact(req.auth!.userId, body);
  sendSuccess(res, row);
});

export const patchMyEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  const body = req.body as UpdateEmergencyContactInput;
  const row = await tenantService.updateMyEmergencyContact(
    req.auth!.userId,
    contactId!,
    body,
  );
  sendSuccess(res, row);
});

export const deleteMyEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  const data = await tenantService.deleteMyEmergencyContact(req.auth!.userId, contactId!);
  sendSuccess(res, data);
});

export const getMyTenantHistory = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
  const data = await tenantService.listMyHistory(req.auth!.userId, page, pageSize);
  sendSuccess(res, data);
});
