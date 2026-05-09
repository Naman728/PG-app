import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useSessionQuery } from "../hooks/useSessionQuery";

export function OwnerGate() {
  const location = useLocation();
  const session = useSessionQuery();

  if (session.isLoading || session.isFetching) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f4f6f5] px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (session.isError || !session.data) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const profile = session.data;

  if (profile.role !== "OWNER" && profile.role !== "STAFF") {
    return <Navigate to={ROUTES.tenant} replace />;
  }

  const onOnboardingRoute = location.pathname.startsWith(ROUTES.ownerOnboarding);

  if (profile.role === "OWNER" && profile.needsOwnerOnboarding && !onOnboardingRoute) {
    return <Navigate to={ROUTES.ownerOnboarding} replace />;
  }

  if (profile.role === "OWNER" && !profile.needsOwnerOnboarding && onOnboardingRoute) {
    return <Navigate to={ROUTES.owner} replace />;
  }

  if (profile.role !== "OWNER" && onOnboardingRoute) {
    return <Navigate to={ROUTES.owner} replace />;
  }

  return <Outlet />;
}
