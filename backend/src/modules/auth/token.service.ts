import jwt from "jsonwebtoken";
import { loadEnv } from "../../config/env.js";
import type { UserRole } from "@prisma/client";

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  const env = loadEnv();
  return jwt.sign({ role: payload.role }, env.JWT_SECRET, {
    subject: payload.sub,
    expiresIn: `${env.JWT_ACCESS_TTL_MIN}m`,
    issuer: "pg-manager",
    audience: "pg-manager-api",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const env = loadEnv();
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: "pg-manager",
    audience: "pg-manager-api",
    complete: false,
  }) as jwt.JwtPayload & { role: UserRole };

  if (!decoded.sub) {
    throw new Error("Invalid token subject");
  }

  return { sub: decoded.sub, role: decoded.role };
}
