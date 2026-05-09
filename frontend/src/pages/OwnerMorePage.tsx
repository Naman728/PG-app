import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { ROUTES } from "../constants/routes";
import { useModal } from "../hooks/useModal";
import { useSessionQuery } from "../hooks/useSessionQuery";
import { OwnerShell } from "../layouts/OwnerShell";
import {
  getPushFoundationStatus,
  requestBrowserNotificationPermission,
} from "../lib/web-push-foundation";
import { logoutApi } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";

export function OwnerMorePage() {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const clearSession = useAuthStore((s) => s.clearSession);
  const session = useSessionQuery();
  const isOwner = session.data?.role === "OWNER";

  function confirmLogout() {
    openModal({
      title: "Sign out",
      description: "You will need to sign in again to access the owner console.",
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

  async function onEnableBrowserAlerts() {
    const s = getPushFoundationStatus();
    if (!s.ok) {
      toast.message("Browser alerts are not supported on this device.");
      return;
    }
    const p = await requestBrowserNotificationPermission();
    if (p === "granted") toast.success("Notifications allowed for this browser");
    else if (p === "denied") toast.error("Notifications blocked — enable them in device settings");
    else toast.message("Permission not granted");
  }

  return (
    <OwnerShell title="More">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Maintenance, PG setup, and account actions. Use the{" "}
          <span className="font-semibold text-slate-800">Alerts</span> button in the header for your
          notification center.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <NavLink
            to={ROUTES.ownerMaintenance}
            className="flex min-h-14 items-center rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 shadow-sm ring-1 ring-black/[0.04] hover:border-[#0f6e56]/40 hover:bg-slate-50"
          >
            Maintenance
          </NavLink>
          {isOwner ? (
            <NavLink
              to={ROUTES.ownerOnboarding}
              className="flex min-h-14 items-center rounded-2xl border-2 border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 shadow-sm ring-1 ring-black/[0.04] hover:border-[#0f6e56]/40 hover:bg-slate-50"
            >
              PG setup
            </NavLink>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <h2 className="text-sm font-semibold text-slate-900">Browser notifications</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Foundation for push alerts (subscription + server delivery can be wired next). Allow
            notifications so the installed app can alert you when we enable push.
          </p>
          <Button type="button" className="mt-3 h-11 w-full sm:w-auto" onClick={() => void onEnableBrowserAlerts()}>
            Check permission
          </Button>
        </div>

        <Button type="button" variant="secondary" className="h-12 w-full" onClick={confirmLogout}>
          Sign out
        </Button>
      </div>
    </OwnerShell>
  );
}
