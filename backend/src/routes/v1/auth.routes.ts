import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateBody } from "../../middleware/validateDto.js";
import {
  login,
  logout,
  me,
  refreshSession,
  register,
} from "../../modules/auth/auth.controller.js";
import {
  previewInvitation,
  requestInvitationOtp,
  verifyInvitationOtp,
} from "../../modules/tenant-invitation/tenant-invitation-public.controller.js";
import { loginDto, registerDto } from "../../validations/auth.dto.js";
import { invitationVerifyOtpDto } from "../../validations/invitation.dto.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const invitePublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post("/register", authLimiter, validateBody(registerDto), register);
authRouter.post("/login", authLimiter, validateBody(loginDto), login);

authRouter.post("/refresh", authLimiter, refreshSession);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);

authRouter.get(
  "/invitations/:token/preview",
  invitePublicLimiter,
  previewInvitation,
);
authRouter.post(
  "/invitations/:token/otp/request",
  invitePublicLimiter,
  requestInvitationOtp,
);
authRouter.post(
  "/invitations/:token/otp/verify",
  invitePublicLimiter,
  validateBody(invitationVerifyOtpDto),
  verifyInvitationOtp,
);
