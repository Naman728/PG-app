import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateTenantProfileDto, type UpdateTenantProfileInput } from "@pg-manager/shared";
import type { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { fetchTenantProfile, patchTenantProfile } from "../../services/tenant.api";

type Form = z.infer<typeof updateTenantProfileDto>;

export function TenantProfilePage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["tenant-profile"], queryFn: fetchTenantProfile });
  const form = useForm<Form>({ resolver: zodResolver(updateTenantProfileDto), defaultValues: {} });

  useEffect(() => {
    if (!profile.data) return;
    form.reset({
      name: profile.data.user.name ?? undefined,
      dateOfBirth: profile.data.tenant.dateOfBirth
        ? profile.data.tenant.dateOfBirth.slice(0, 10)
        : undefined,
      occupation: profile.data.tenant.occupation ?? undefined,
      permanentAddress: profile.data.tenant.permanentAddress ?? undefined,
      aadhaarLast4: undefined,
    });
  }, [profile.data, form]);

  const mut = useMutation({
    mutationFn: (body: UpdateTenantProfileInput) => patchTenantProfile(body),
    onSuccess: async () => {
      toast.success("Saved");
      await qc.invalidateQueries({ queryKey: ["tenant-profile"] });
      await qc.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const t = profile.data?.tenant;
  const locked = t?.status === "PENDING_REVIEW";

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-sm font-semibold text-slate-900">Tenant profile</h2>
      <p className="mt-1 text-xs text-slate-600">
        Aadhaar is shown masked elsewhere. Only last four digits are stored when you provide them.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={form.handleSubmit((values) => {
          const body: UpdateTenantProfileInput = { ...values };
          if (body.dateOfBirth && !body.dateOfBirth.includes("T")) {
            body.dateOfBirth = new Date(`${body.dateOfBirth}T12:00:00.000Z`).toISOString();
          }
          mut.mutate(body);
        })}
      >
        <label className="text-xs font-medium sm:col-span-2">
          Name
          <Input className="mt-1" {...form.register("name")} disabled={locked} />
        </label>
        <label className="text-xs font-medium">
          DOB
          <Input type="date" className="mt-1" {...form.register("dateOfBirth")} disabled={locked} />
        </label>
        <label className="text-xs font-medium">
          Aadhaar last 4
          <Input className="mt-1" maxLength={4} {...form.register("aadhaarLast4")} disabled={locked} />
        </label>
        <label className="text-xs font-medium sm:col-span-2">
          Occupation
          <Input className="mt-1" {...form.register("occupation")} disabled={locked} />
        </label>
        <label className="text-xs font-medium sm:col-span-2">
          Address
          <textarea
            className="mt-1 min-h-[88px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            {...form.register("permanentAddress")}
            disabled={locked}
          />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={locked || mut.isPending}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
