import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { OwnerGate } from "../layouts/OwnerGate";
import { TenantShell } from "../layouts/TenantShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { RouteFallback } from "./RouteFallback";

const AcceptInvitePage = lazy(() =>
  import("../pages/AcceptInvitePage").then((m) => ({ default: m.AcceptInvitePage })),
);
const LoginPage = lazy(() => import("../pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("../pages/SignupPage").then((m) => ({ default: m.SignupPage })));
const OwnerDashboardPage = lazy(() =>
  import("../pages/OwnerDashboardPage").then((m) => ({ default: m.OwnerDashboardPage })),
);
const OwnerOnboardingPage = lazy(() =>
  import("../pages/OwnerOnboardingPage").then((m) => ({ default: m.OwnerOnboardingPage })),
);
const OwnerPropertyPage = lazy(() =>
  import("../pages/OwnerPropertyPage").then((m) => ({ default: m.OwnerPropertyPage })),
);
const OwnerVacancyPage = lazy(() =>
  import("../pages/OwnerVacancyPage").then((m) => ({ default: m.OwnerVacancyPage })),
);
const OwnerMaintenanceListPage = lazy(() =>
  import("../pages/owner/OwnerMaintenanceListPage").then((m) => ({ default: m.OwnerMaintenanceListPage })),
);
const OwnerMaintenanceTicketPage = lazy(() =>
  import("../pages/owner/OwnerMaintenanceTicketPage").then((m) => ({
    default: m.OwnerMaintenanceTicketPage,
  })),
);
const OwnerRentPage = lazy(() =>
  import("../pages/owner/OwnerRentPage").then((m) => ({ default: m.OwnerRentPage })),
);
const OwnerTenantDetailPage = lazy(() =>
  import("../pages/owner/OwnerTenantDetailPage").then((m) => ({ default: m.OwnerTenantDetailPage })),
);
const OwnerTenantsPage = lazy(() =>
  import("../pages/owner/OwnerTenantsPage").then((m) => ({ default: m.OwnerTenantsPage })),
);
const OwnerMorePage = lazy(() => import("../pages/OwnerMorePage").then((m) => ({ default: m.OwnerMorePage })));
const TenantDocumentsPage = lazy(() =>
  import("../pages/tenant/TenantDocumentsPage").then((m) => ({ default: m.TenantDocumentsPage })),
);
const TenantHistoryPage = lazy(() =>
  import("../pages/tenant/TenantHistoryPage").then((m) => ({ default: m.TenantHistoryPage })),
);
const TenantMaintenanceDetailPage = lazy(() =>
  import("../pages/tenant/TenantMaintenanceDetailPage").then((m) => ({
    default: m.TenantMaintenanceDetailPage,
  })),
);
const TenantMaintenanceListPage = lazy(() =>
  import("../pages/tenant/TenantMaintenanceListPage").then((m) => ({
    default: m.TenantMaintenanceListPage,
  })),
);
const TenantMaintenanceNewPage = lazy(() =>
  import("../pages/tenant/TenantMaintenanceNewPage").then((m) => ({
    default: m.TenantMaintenanceNewPage,
  })),
);
const TenantRentPage = lazy(() =>
  import("../pages/tenant/TenantRentPage").then((m) => ({ default: m.TenantRentPage })),
);
const TenantHomePage = lazy(() =>
  import("../pages/tenant/TenantHomePage").then((m) => ({ default: m.TenantHomePage })),
);
const TenantNoticesPage = lazy(() =>
  import("../pages/tenant/TenantNoticesPage").then((m) => ({ default: m.TenantNoticesPage })),
);
const TenantOnboardingPage = lazy(() =>
  import("../pages/tenant/TenantOnboardingPage").then((m) => ({ default: m.TenantOnboardingPage })),
);
const TenantProfilePage = lazy(() =>
  import("../pages/tenant/TenantProfilePage").then((m) => ({ default: m.TenantProfilePage })),
);

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path={ROUTES.home} element={<Navigate to={ROUTES.owner} replace />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.signup} element={<SignupPage />} />
          <Route path="/join/:token" element={<AcceptInvitePage />} />
          <Route
            path={ROUTES.tenant}
            element={
              <ProtectedRoute roles={["TENANT"]}>
                <TenantShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<TenantHomePage />} />
            <Route path="onboarding" element={<TenantOnboardingPage />} />
            <Route path="profile" element={<TenantProfilePage />} />
            <Route path="documents" element={<TenantDocumentsPage />} />
            <Route path="history" element={<TenantHistoryPage />} />
            <Route path="rent" element={<TenantRentPage />} />
            <Route path="notices" element={<TenantNoticesPage />} />
            <Route path="maintenance/new" element={<TenantMaintenanceNewPage />} />
            <Route path="maintenance/:ticketId" element={<TenantMaintenanceDetailPage />} />
            <Route path="maintenance" element={<TenantMaintenanceListPage />} />
          </Route>
          <Route
            path={ROUTES.owner}
            element={
              <ProtectedRoute roles={["OWNER", "STAFF"]}>
                <OwnerGate />
              </ProtectedRoute>
            }
          >
            <Route path="onboarding" element={<OwnerOnboardingPage />} />
            <Route path="property" element={<OwnerPropertyPage />} />
            <Route path="vacancy" element={<OwnerVacancyPage />} />
            <Route path="tenants" element={<OwnerTenantsPage />} />
            <Route path="tenants/:tenantId" element={<OwnerTenantDetailPage />} />
            <Route path="rent" element={<OwnerRentPage />} />
            <Route path="maintenance/:ticketId" element={<OwnerMaintenanceTicketPage />} />
            <Route path="maintenance" element={<OwnerMaintenanceListPage />} />
            <Route path="more" element={<OwnerMorePage />} />
            <Route index element={<OwnerDashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.owner} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
