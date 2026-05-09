import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { Button } from "../../components/ui/button";
import { fetchTenantProfile } from "../../services/tenant.api";

export function TenantHomePage() {
  const profile = useQuery({
    queryKey: ["tenant-profile"],
    queryFn: fetchTenantProfile,
  });

  const t = profile.data?.tenant;
  const bed = profile.data?.bedAssignment;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-slate-900">Status</h2>
        {profile.isLoading ? (
          <p className="mt-2 text-sm text-slate-500">Loading…</p>
        ) : (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Lifecycle</dt>
              <dd className="font-medium text-slate-900">{t?.status ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Aadhaar (masked)</dt>
              <dd className="font-medium text-slate-900">
                {t?.aadhaarMasked ?? "Not set"}
              </dd>
            </div>
            {t?.moveInAt ? (
              <div>
                <dt className="text-slate-500">Move-in</dt>
                <dd className="font-medium text-slate-900">
                  {new Date(t.moveInAt).toLocaleDateString()}
                </dd>
              </div>
            ) : null}
            {t?.kycSubmittedAt ? (
              <div>
                <dt className="text-slate-500">KYC submitted</dt>
                <dd className="font-medium text-slate-900">
                  {new Date(t.kycSubmittedAt).toLocaleString()}
                </dd>
              </div>
            ) : null}
          </dl>
        )}
        <div className="mt-4">
          <Link to={ROUTES.tenantOnboarding}>
            <Button type="button" variant="secondary">
              Continue onboarding
            </Button>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-slate-900">Room assignment</h2>
        {bed ? (
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-medium">{bed.floor.name}</span> · Room{" "}
            <span className="font-medium">{bed.room.name}</span> · Bed{" "}
            <span className="font-medium">{bed.label}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            No bed assigned yet. Your PG owner will assign you from the property map when
            ready.
          </p>
        )}
      </section>
    </div>
  );
}
