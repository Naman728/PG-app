import type { UpdateOrganizationProfileInput } from "@pg-manager/shared";
import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { OrganizationService } from "./organization.service.js";

const organizationService = new OrganizationService();

export const updateOrganizationProfile = asyncHandler(async (req, res) => {
  const orgId = req.params.orgId;
  const body = req.body as UpdateOrganizationProfileInput;
  const org = await organizationService.updateProfile(orgId, body);
  sendSuccess(res, {
    id: org.id,
    name: org.name,
    city: org.city,
    addressLine1: org.addressLine1,
    addressLine2: org.addressLine2,
    locality: org.locality,
    pincode: org.pincode,
    onboardingCompletedAt: org.onboardingCompletedAt,
  });
});
