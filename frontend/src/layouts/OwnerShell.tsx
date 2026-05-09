import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OwnerNotificationBell } from "../components/notifications/OwnerNotificationBell";
import { ROUTES } from "../constants/routes";
import { useModal } from "../hooks/useModal";
import { logoutApi } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";

type Props = {
  title: string;
  children: ReactNode;
  /** Wider main column for dense dashboards (e.g. floor map). */
  contentMaxClassName?: string;
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "block rounded-lg px-3 py-2 transition-colors",
    isActive
      ? "bg-white/15 font-medium text-white"
      : "text-emerald-100/90 hover:bg-white/10 hover:text-white",
  ].join(" ");

function TabIconHome({ active }: { active: boolean }) {
  const c = active ? "text-white" : "text-emerald-200";
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

function TabIconMap({ active }: { active: boolean }) {
  const c = active ? "text-white" : "text-emerald-200";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7.5l6-3 8 4v13l-6-3-8 4V7.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M10 4.5v13M16 8.5v9" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function TabIconVacancy({ active }: { active: boolean }) {
  const c = active ? "text-white" : "text-emerald-200";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function TabIconPeople({ active }: { active: boolean }) {
  const c = active ? "text-white" : "text-emerald-200";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 20v-1a5 5 0 015-5h2a5 5 0 015 5v1" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function TabIconRent({ active }: { active: boolean }) {
  const c = active ? "text-white" : "text-emerald-200";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 9h4M8 13h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function TabIconMore({ active }: { active: boolean }) {
  const c = active ? "text-white" : "text-emerald-200";
  return (
    <svg className={c} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.75" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      <circle cx="18" cy="12" r="1.75" fill="currentColor" />
    </svg>
  );
}

const tabBtn =
  "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-semibold leading-tight transition active:scale-[0.98]";

export function OwnerShell({ title, children, contentMaxClassName }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useModal();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const showMobileBottomNav = !location.pathname.startsWith(ROUTES.ownerOnboarding);
  const pathname = location.pathname;
  const moreTabActive =
    pathname === ROUTES.ownerMore || pathname.startsWith(`${ROUTES.ownerMaintenance}`);

  function confirmLogout() {
    openModal({
      title: "Sign out",
      description: "You will need to sign in again to access the owner dashboard.",
      confirmLabel: "Sign out",
      tone: "danger",
      onConfirm: async () => {
        try {
          await logoutApi();
        } catch {
          // still clear local session
        }
        clearSession();
        toast.message("Signed out");
        navigate(ROUTES.login, { replace: true });
      },
    });
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f4f6f5] md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-emerald-950/50 bg-[#1a4d32] text-emerald-50 md:flex md:min-h-full md:flex-col">
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-sm font-semibold text-white ring-1 ring-white/20">
              PG
            </div>
            <div>
              <div className="text-sm font-semibold text-white">PG Manager</div>
              <div className="text-xs text-emerald-200/80">Owner console</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OwnerNotificationBell />
            <button
              type="button"
              onClick={confirmLogout}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-emerald-50 hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3 pb-4 text-sm">
          <NavLink to={ROUTES.owner} end className={navLinkClass}>
            Overview
          </NavLink>
          <NavLink to={ROUTES.ownerProperty} className={navLinkClass}>
            Floor map
          </NavLink>
          <NavLink to={ROUTES.ownerVacancy} className={navLinkClass}>
            Vacancy
          </NavLink>
          <NavLink to={ROUTES.ownerTenants} className={navLinkClass}>
            Tenants & KYC
          </NavLink>
          <NavLink to={ROUTES.ownerRent} className={navLinkClass}>
            Rent & reminders
          </NavLink>
          <NavLink to={ROUTES.ownerMaintenance} className={navLinkClass}>
            Maintenance
          </NavLink>
          <NavLink to={ROUTES.ownerMore} className={navLinkClass}>
            More
          </NavLink>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-emerald-950/35 bg-[#1a4d32] px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))] text-white md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm font-semibold ring-1 ring-white/20">
              PG
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">PG Manager</div>
              <div className="truncate text-xs text-emerald-200/90">{title}</div>
            </div>
          </div>
          <OwnerNotificationBell />
        </div>

        <main
          className={[
            "flex-1 px-4 py-5 md:px-8 md:py-6",
            showMobileBottomNav
              ? "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6"
              : "pb-6",
          ].join(" ")}
        >
          <div className={`mx-auto ${contentMaxClassName ?? "max-w-5xl"}`}>
            <header className="mb-5 flex flex-col gap-1 md:mb-6">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">{title}</h1>
              {user ? (
                <p className="hidden text-sm text-slate-600 md:block">
                  Signed in as{" "}
                  <span className="font-medium text-slate-900">
                    {user.email ?? user.phone ?? "—"}
                  </span>
                </p>
              ) : null}
            </header>
            {children}
          </div>
        </main>
      </div>

      {showMobileBottomNav ? (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-emerald-950/30 bg-[#1a4d32] pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] pt-1 shadow-[0_-10px_40px_rgba(15,23,42,0.18)] md:hidden"
          aria-label="Primary"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1">
            <NavLink
              to={ROUTES.owner}
              end
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-white/15 text-white" : "text-emerald-100/90 hover:bg-white/10",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabIconHome active={isActive} />
                  Dashboard
                </>
              )}
            </NavLink>
            <NavLink
              to={ROUTES.ownerProperty}
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-white/15 text-white" : "text-emerald-100/90 hover:bg-white/10",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabIconMap active={isActive} />
                  Map
                </>
              )}
            </NavLink>
            <NavLink
              to={ROUTES.ownerVacancy}
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-white/15 text-white" : "text-emerald-100/90 hover:bg-white/10",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabIconVacancy active={isActive} />
                  Vacancy
                </>
              )}
            </NavLink>
            <NavLink
              to={ROUTES.ownerTenants}
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-white/15 text-white" : "text-emerald-100/90 hover:bg-white/10",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabIconPeople active={isActive} />
                  Tenants
                </>
              )}
            </NavLink>
            <NavLink
              to={ROUTES.ownerRent}
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive ? "bg-white/15 text-white" : "text-emerald-100/90 hover:bg-white/10",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabIconRent active={isActive} />
                  Rent
                </>
              )}
            </NavLink>
            <NavLink
              to={ROUTES.ownerMore}
              className={({ isActive }) =>
                [
                  tabBtn,
                  isActive || moreTabActive
                    ? "bg-white/15 text-white"
                    : "text-emerald-100/90 hover:bg-white/10",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <TabIconMore active={isActive || moreTabActive} />
                  More
                </>
              )}
            </NavLink>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
