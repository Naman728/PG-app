import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { updateOrganizationProfileDto } from "@pg-manager/shared";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ROUTES } from "../constants/routes";
import { useSessionQuery } from "../hooks/useSessionQuery";
import { OwnerShell } from "../layouts/OwnerShell";
import { patchOrganizationProfile } from "../services/owner.api";

const stepSchema = updateOrganizationProfileDto
  .pick({
    name: true,
    city: true,
    addressLine1: true,
    locality: true,
    pincode: true,
  })
  .extend({
    name: z.string().min(2, "Name is required"),
    city: z.string().min(2, "City is required"),
  });

type StepValues = z.infer<typeof stepSchema>;

export function OwnerOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSessionQuery();
  const orgId = session.data?.primaryOrganization?.id;

  const form = useForm<StepValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      name: "",
      city: "Bengaluru",
      addressLine1: "",
      locality: "",
      pincode: "",
    },
  });

  useEffect(() => {
    const org = session.data?.primaryOrganization;
    if (!org) return;
    form.reset({
      name: org.name,
      city: org.city,
      addressLine1: org.addressLine1 ?? "",
      locality: org.locality ?? "",
      pincode: org.pincode ?? "",
    });
    // form instance is stable; reset when org id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.data?.primaryOrganization?.id]);

  const mutation = useMutation({
    mutationFn: async (values: StepValues) => {
      if (!orgId) throw new Error("Missing organization");
      return patchOrganizationProfile(orgId, {
        ...values,
        completeOnboarding: true,
      });
    },
    onSuccess: async () => {
      toast.success("Welcome to PG Manager");
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      navigate(ROUTES.owner, { replace: true });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!orgId) {
    return (
      <OwnerShell title="Onboarding">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No organization found for this account. Contact support.
        </div>
      </OwnerShell>
    );
  }

  return (
    <OwnerShell title="Set up your PG">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-sm text-slate-600">
          Tell us about your property so the tenant app and dashboards stay
          accurate. You can edit this later in settings.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              PG / property name
            </label>
            <Input {...form.register("name")} error={form.formState.errors.name?.message} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              City
            </label>
            <Input {...form.register("city")} error={form.formState.errors.city?.message} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Address line
            </label>
            <Input
              {...form.register("addressLine1")}
              error={form.formState.errors.addressLine1?.message}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Locality / area
            </label>
            <Input
              {...form.register("locality")}
              error={form.formState.errors.locality?.message}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              PIN code
            </label>
            <Input {...form.register("pincode")} error={form.formState.errors.pincode?.message} />
          </div>

          <Button type="submit" className="w-full py-2.5" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Finish & go to dashboard"}
          </Button>
        </form>
      </div>
    </OwnerShell>
  );
}
