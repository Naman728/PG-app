import { NavLink } from "react-router-dom";
import { ROUTES } from "../../constants/routes";

/**
 * Placeholder for PG → tenant notices. In-app / push can reuse this route when APIs exist.
 */
export function TenantNoticesPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.04]">
      <h2 className="text-lg font-semibold text-slate-900">Notices</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Important updates from your PG will appear here. Rent reminders and tickets stay under
        their tabs for now.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <NavLink
          to={ROUTES.tenantRent}
          className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[#0f6e56] hover:bg-slate-100"
        >
          View rent →
        </NavLink>
        <NavLink
          to={ROUTES.tenantMaintenance}
          className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[#0f6e56] hover:bg-slate-100"
        >
          Maintenance tickets →
        </NavLink>
      </div>
    </div>
  );
}
