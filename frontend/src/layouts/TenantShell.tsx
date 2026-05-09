import type { ReactNode } from "react";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ROUTES } from "../constants/routes";
import { useSessionQuery } from "../hooks/useSessionQuery";
import { logoutApi } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";
import { Button } from "../components/ui/button";

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
  ].join(" ");

type Props = { children?: ReactNode };

export function TenantShell({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useSessionQuery();
  const clearSession = useAuthStore((s) => s.clearSession);
  const tp = session.data?.tenantProfile;

  useEffect(() => {
    if (!session.data || !tp) return;
    if (tp.status === "ACTIVE" && location.pathname.startsWith(ROUTES.tenantOnboarding)) {
      navigate(ROUTES.tenant, { replace: true });
      return;
    }
    if (tp.status === "ONBOARDING" && !tp.kycSubmittedAt) {
      const atRoot =
        location.pathname === ROUTES.tenant || location.pathname === `${ROUTES.tenant}/`;
      if (atRoot) {
        navigate(ROUTES.tenantOnboarding, { replace: true });
      }
    }
  }, [session.data, tp, location.pathname, navigate]);

  async function onLogout() {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    clearSession();
    toast.message("Signed out");
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <div className="min-h-full bg-[#f4f6f5]">
      <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Tenant portal
            </div>
            <h1 className="text-xl font-semibold text-slate-900">PG Manager</h1>
            <p className="text-sm text-slate-600">
              Signed in as{" "}
              <span className="font-medium text-slate-900">
                {session.data?.phone ?? "…"}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" type="button" onClick={() => void onLogout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-4 md:px-8">
        <nav className="mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <NavLink to={ROUTES.tenant} end className={navClass}>
            Home
          </NavLink>
          <NavLink to={ROUTES.tenantOnboarding} className={navClass}>
            Onboarding & KYC
          </NavLink>
          <NavLink to={ROUTES.tenantProfile} className={navClass}>
            Profile
          </NavLink>
          <NavLink to={ROUTES.tenantDocuments} className={navClass}>
            Documents
          </NavLink>
          <NavLink to={ROUTES.tenantHistory} className={navClass}>
            History
          </NavLink>
          <NavLink to={ROUTES.tenantRent} className={navClass}>
            Rent
          </NavLink>
          <NavLink to={ROUTES.tenantMaintenance} className={navClass}>
            Maintenance
          </NavLink>
        </nav>
        {children ?? <Outlet />}
      </div>
    </div>
  );
}
