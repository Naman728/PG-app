import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAuthStore } from "../store/auth.store";

type Props = {
  children: ReactElement;
  roles?: string[];
};

export function ProtectedRoute({ children, roles }: Props) {
  const location = useLocation();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!token || !user) {
    return (
      <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
    );
  }

  if (roles && !roles.includes(user.role)) {
    if (user.role === "TENANT") {
      return <Navigate to={ROUTES.tenant} replace />;
    }
    if (user.role === "OWNER" || user.role === "STAFF") {
      return <Navigate to={ROUTES.owner} replace />;
    }
    return <Navigate to={ROUTES.login} replace />;
  }

  return children;
}
