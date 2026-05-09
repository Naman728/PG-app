import type { AuthUser } from "../store/auth.store";
import type { SessionProfile } from "../types/session";

export function mapSessionToAuthUser(profile: SessionProfile): AuthUser {
  return {
    id: profile.id,
    phone: profile.phone,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    phoneVerified: profile.phoneVerified,
  };
}
