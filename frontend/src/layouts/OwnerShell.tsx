import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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

export function OwnerShell({ title, children, contentMaxClassName }: Props) {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

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
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="w-full border-b border-emerald-950/40 bg-[#1a4d32] text-emerald-50 md:w-64 md:border-b-0 md:border-r md:border-emerald-950/50 md:min-h-full">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:flex-col md:items-stretch">
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
        <nav className="hidden flex-col gap-1 px-3 pb-4 text-sm md:flex">
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
        </nav>
        <nav className="flex flex-wrap gap-2 border-t border-white/10 px-3 py-2 text-sm md:hidden">
          <NavLink
            to={ROUTES.owner}
            end
            className="flex-1 rounded-lg border border-white/15 py-2 text-center text-emerald-50 aria-[current=page]:border-white/40 aria-[current=page]:bg-white/15 aria-[current=page]:text-white"
          >
            Overview
          </NavLink>
          <NavLink
            to={ROUTES.ownerProperty}
            className="flex-1 rounded-lg border border-white/15 py-2 text-center text-emerald-50 aria-[current=page]:border-white/40 aria-[current=page]:bg-white/15 aria-[current=page]:text-white"
          >
            Map
          </NavLink>
          <NavLink
            to={ROUTES.ownerVacancy}
            className="flex-1 rounded-lg border border-white/15 py-2 text-center text-emerald-50 aria-[current=page]:border-white/40 aria-[current=page]:bg-white/15 aria-[current=page]:text-white"
          >
            Free
          </NavLink>
          <NavLink
            to={ROUTES.ownerTenants}
            className="flex-1 rounded-lg border border-white/15 py-2 text-center text-emerald-50 aria-[current=page]:border-white/40 aria-[current=page]:bg-white/15 aria-[current=page]:text-white"
          >
            Tenants
          </NavLink>
          <NavLink
            to={ROUTES.ownerRent}
            className="flex-1 rounded-lg border border-white/15 py-2 text-center text-emerald-50 aria-[current=page]:border-white/40 aria-[current=page]:bg-white/15 aria-[current=page]:text-white"
          >
            Rent
          </NavLink>
          <NavLink
            to={ROUTES.ownerMaintenance}
            className="flex-1 rounded-lg border border-white/15 py-2 text-center text-emerald-50 aria-[current=page]:border-white/40 aria-[current=page]:bg-white/15 aria-[current=page]:text-white"
          >
            Fix
          </NavLink>
        </nav>
      </aside>

      <main className="flex-1 bg-[#f4f6f5] px-4 py-6 md:px-8">
        <div className={`mx-auto ${contentMaxClassName ?? "max-w-5xl"}`}>
          <header className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
            {user ? (
              <p className="text-sm text-slate-600">
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
  );
}
