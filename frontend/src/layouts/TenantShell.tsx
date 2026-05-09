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

const tabBtn =
  "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-semibold leading-tight text-slate-600 transition active:scale-[0.98]";

type Props = { children?: ReactNode };

function TabHome({ active }: { active: boolean }) {
  const c = active ? "text-[#0f6e56]" : "text-slate-400";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabRent({ active }: { active: boolean }) {
  const c = active ? "text-[#0f6e56]" : "text-slate-400";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 9h4M8 13h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function TabTickets({ active }: { active: boolean }) {
  const c = active ? "text-[#0f6e56]" : "text-slate-400";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h8v12H8V6zM8 10h8M10 6V4M14 6V4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabNotices({ active }: { active: boolean }) {
  const c = active ? "text-[#0f6e56]" : "text-slate-400";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 10a6 6 0 1112 0v6l2 2H4l2-2v-6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabProfile({ active }: { active: boolean }) {
  const c = active ? "text-[#0f6e56]" : "text-slate-400";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5 20v-1a6 6 0 0112 0v1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

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

  const showMobileBottomNav = !location.pathname.startsWith(ROUTES.tenantOnboarding);

  return (
    <div className="min-h-full bg-[#f4f6f5]">
      <header className="border-b border-slate-200 bg-white px-4 py-3 md:px-8 md:py-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">Tenant portal</div>
            <h1 className="truncate text-lg font-semibold text-slate-900 md:text-xl">PG Manager</h1>
            <p className="truncate text-xs text-slate-600 md:text-sm">
              Signed in as{" "}
              <span className="font-medium text-slate-900">{session.data?.phone ?? "…"}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" type="button" className="h-11 min-w-[5.5rem]" onClick={() => void onLogout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div
        className={[
          "mx-auto max-w-5xl px-4 md:px-8",
          showMobileBottomNav
            ? "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-4 md:pb-6"
            : "py-4 md:py-6",
        ].join(" ")}
      >
        <nav className="mb-6 hidden flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:flex">
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
          <NavLink to={ROUTES.tenantNotices} className={navClass}>
            Notices
          </NavLink>
          <NavLink to={ROUTES.tenantMaintenance} className={navClass}>
            Maintenance
          </NavLink>
        </nav>
        {children ?? <Outlet />}
      </div>

      {showMobileBottomNav ? (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] pt-1 shadow-[0_-10px_40px_rgba(15,23,42,0.08)] md:hidden"
          aria-label="Primary"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1">
            <NavLink
              to={ROUTES.tenant}
              end
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-slate-100 text-[#0f6e56]" : "hover:bg-slate-50",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabHome active={isActive} />
                  Home
                </>
              )}
            </NavLink>
            <NavLink
              to={ROUTES.tenantRent}
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-slate-100 text-[#0f6e56]" : "hover:bg-slate-50",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabRent active={isActive} />
                  Rent
                </>
              )}
            </NavLink>
            <NavLink
              to={ROUTES.tenantMaintenance}
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-slate-100 text-[#0f6e56]" : "hover:bg-slate-50",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabTickets active={isActive} />
                  Tickets
                </>
              )}
            </NavLink>
            <NavLink
              to={ROUTES.tenantNotices}
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-slate-100 text-[#0f6e56]" : "hover:bg-slate-50",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabNotices active={isActive} />
                  Notices
                </>
              )}
            </NavLink>
            <NavLink
              to={ROUTES.tenantProfile}
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-slate-100 text-[#0f6e56]" : "hover:bg-slate-50",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabProfile active={isActive} />
                  Profile
                </>
              )}
            </NavLink>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
