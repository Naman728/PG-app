import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { inviteTenantDto } from "@pg-manager/shared";
import type { z } from "zod";
import { DataTable, type DataTableColumn } from "../components/ui/data-table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { OwnerShell } from "../layouts/OwnerShell";
import { useSessionQuery } from "../hooks/useSessionQuery";
import {
  createTenantInvitation,
  listTenantInvitations,
} from "../services/owner.api";

type InviteForm = z.infer<typeof inviteTenantDto>;

type AccountRow = { field: string; value: string };

export function OwnerDashboardPage() {
  const queryClient = useQueryClient();
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;

  const inviteForm = useForm<InviteForm>({
    resolver: zodResolver(inviteTenantDto),
    defaultValues: { phone: "" },
  });

  const invitesQuery = useQuery({
    queryKey: ["tenant-invites", orgId],
    queryFn: () => listTenantInvitations(orgId!),
    enabled: Boolean(orgId),
  });

  const inviteMutation = useMutation({
    mutationFn: (values: InviteForm) =>
      createTenantInvitation(orgId!, values),
    onSuccess: async () => {
      toast.success("Invitation SMS sent");
      inviteForm.reset({ phone: "" });
      await queryClient.invalidateQueries({ queryKey: ["tenant-invites", orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rows: AccountRow[] = session.data
    ? [
        { field: "Role", value: String(session.data.role) },
        {
          field: "Phone verified",
          value: session.data.phoneVerified ? "Yes" : "No",
        },
        {
          field: "Last login",
          value: session.data.lastLoginAt
            ? new Date(session.data.lastLoginAt).toLocaleString()
            : "—",
        },
        {
          field: "Onboarding",
          value: session.data.needsOwnerOnboarding ? "Pending" : "Complete",
        },
      ]
    : [];

  const columns: Array<DataTableColumn<AccountRow>> = [
    { id: "field", header: "Field", cell: (r) => r.field },
    { id: "value", header: "Value", cell: (r) => r.value },
  ];

  const inviteColumns: Array<
    DataTableColumn<{
      id: string;
      phone: string;
      createdAt: string;
      expiresAt: string;
      invitedBy: { name: string | null; phone: string };
    }>
  > = [
    { id: "phone", header: "Phone", cell: (r) => r.phone },
    {
      id: "invitedBy",
      header: "Invited by",
      cell: (r) => r.invitedBy.name ?? r.invitedBy.phone,
    },
    {
      id: "expiresAt",
      header: "Expires",
      cell: (r) => new Date(r.expiresAt).toLocaleString(),
    },
  ];

  const inviteRows = invitesQuery.data?.invitations ?? [];

  return (
    <OwnerShell title="Owner dashboard">
      {session.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load your profile. Try refreshing the page.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-slate-900">Account</h2>
            <div className="mt-4">
              <DataTable
                columns={columns}
                rows={rows}
                getRowId={(r) => r.field}
                isLoading={session.isLoading}
                emptyLabel="No profile loaded"
              />
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-sm font-semibold text-slate-900">Invite tenant (SMS)</h2>
            <p className="mt-2 text-xs text-slate-600">
              Sends an SMS with a secure link. The tenant signs in with OTP on that phone.
            </p>
            {!orgId ? (
              <p className="mt-3 text-sm text-amber-800">
                Organization is not ready yet. Finish onboarding first.
              </p>
            ) : (
              <form
                className="mt-4 space-y-3"
                onSubmit={inviteForm.handleSubmit((v) => inviteMutation.mutate(v))}
              >
                <Input
                  placeholder="+9198XXXXXXXX"
                  {...inviteForm.register("phone")}
                  error={inviteForm.formState.errors.phone?.message}
                />
                <Button
                  type="submit"
                  className="w-full py-2"
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? "Sending…" : "Send SMS invite"}
                </Button>
              </form>
            )}
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900">Pending invitations</h2>
            <div className="mt-4">
              <DataTable
                columns={inviteColumns}
                rows={inviteRows}
                getRowId={(r) => r.id}
                isLoading={invitesQuery.isLoading}
                emptyLabel="No pending invitations"
              />
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900">Next modules</h2>
            <p className="mt-3 text-sm text-slate-600">
              Rooms & beds, rent, and WhatsApp-first reminders ship next. Auth +
              onboarding are production-ready: OTP expiry, refresh rotation, org
              RBAC, and tenant SMS invites.
            </p>
          </section>
        </div>
      )}
    </OwnerShell>
  );
}
