import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createEmergencyContactDto,
  updateTenantProfileDto,
  type CreateEmergencyContactInput,
  type UpdateTenantProfileInput,
} from "@pg-manager/shared";
import type { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  createTenantEmergencyContact,
  fetchTenantProfile,
  patchTenantProfile,
  submitTenantKyc,
  uploadTenantDocument,
} from "../../services/tenant.api";

type ProfileForm = z.infer<typeof updateTenantProfileDto>;
type EcForm = z.infer<typeof createEmergencyContactDto>;

const docCategories = [
  { value: "AADHAAR_FRONT", label: "Aadhaar front" },
  { value: "AADHAAR_BACK", label: "Aadhaar back" },
  { value: "PROFILE_PHOTO", label: "Profile photo" },
  { value: "RENT_AGREEMENT", label: "Rent agreement" },
  { value: "OTHER", label: "Other" },
] as const;

export function TenantOnboardingPage() {
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["tenant-profile"],
    queryFn: fetchTenantProfile,
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(updateTenantProfileDto),
    defaultValues: {},
  });

  useEffect(() => {
    if (!profile.data) return;
    profileForm.reset({
      name: profile.data.user.name ?? undefined,
      dateOfBirth: profile.data.tenant.dateOfBirth
        ? profile.data.tenant.dateOfBirth.slice(0, 10)
        : undefined,
      occupation: profile.data.tenant.occupation ?? undefined,
      permanentAddress: profile.data.tenant.permanentAddress ?? undefined,
      aadhaarLast4: undefined,
    });
  }, [profile.data, profileForm]);

  const ecForm = useForm<EcForm>({
    resolver: zodResolver(createEmergencyContactDto),
    defaultValues: { name: "", phone: "", relation: "", isPrimary: false },
  });

  const saveProfile = useMutation({
    mutationFn: (body: UpdateTenantProfileInput) => patchTenantProfile(body),
    onSuccess: async () => {
      toast.success("Profile saved");
      await qc.invalidateQueries({ queryKey: ["tenant-profile"] });
      await qc.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addEc = useMutation({
    mutationFn: (body: CreateEmergencyContactInput) => createTenantEmergencyContact(body),
    onSuccess: async () => {
      toast.success("Contact added");
      ecForm.reset({ name: "", phone: "", relation: "", isPrimary: false });
      await qc.invalidateQueries({ queryKey: ["tenant-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadDoc = useMutation({
    mutationFn: ({ category, file }: { category: string; file: File }) =>
      uploadTenantDocument(category, file),
    onSuccess: async () => {
      toast.success("Document uploaded");
      await qc.invalidateQueries({ queryKey: ["tenant-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitKyc = useMutation({
    mutationFn: submitTenantKyc,
    onSuccess: async () => {
      toast.success("KYC submitted for review");
      await qc.invalidateQueries({ queryKey: ["tenant-profile"] });
      await qc.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const t = profile.data?.tenant;
  const locked = t?.status === "PENDING_REVIEW" || t?.status === "ACTIVE";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-slate-900">1. Personal details</h2>
        <p className="mt-1 text-xs text-slate-600">
          Only the <strong>last 4 digits</strong> of Aadhaar are stored. Never enter the full
          number.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={profileForm.handleSubmit((values) => {
            const body: UpdateTenantProfileInput = { ...values };
            if (body.dateOfBirth && !body.dateOfBirth.includes("T")) {
              body.dateOfBirth = new Date(`${body.dateOfBirth}T12:00:00.000Z`).toISOString();
            }
            saveProfile.mutate(body);
          })}
        >
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            Full name
            <Input className="mt-1" {...profileForm.register("name")} disabled={locked} />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Date of birth
            <Input type="date" className="mt-1" {...profileForm.register("dateOfBirth")} disabled={locked} />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Aadhaar last 4 digits
            <Input
              className="mt-1"
              maxLength={4}
              inputMode="numeric"
              {...profileForm.register("aadhaarLast4")}
              disabled={locked}
              placeholder="1234"
            />
          </label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            Occupation
            <Input className="mt-1" {...profileForm.register("occupation")} disabled={locked} />
          </label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            Permanent address
            <textarea
              className="mt-1 min-h-[88px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              {...profileForm.register("permanentAddress")}
              disabled={locked}
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={locked || saveProfile.isPending}>
              Save personal details
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-slate-900">2. Emergency contacts</h2>
        <p className="mt-1 text-xs text-slate-600">At least one contact is required before KYC.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {(profile.data?.emergencyContacts ?? []).map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="font-medium">{c.name}</span> · {c.phone} · {c.relation}
              {c.isPrimary ? (
                <span className="ml-2 text-xs text-primary">Primary</span>
              ) : null}
            </li>
          ))}
        </ul>
        {!locked ? (
          <form
            className="mt-4 grid gap-2 sm:grid-cols-2"
            onSubmit={ecForm.handleSubmit((v) => addEc.mutate(v))}
          >
            <Input placeholder="Name" {...ecForm.register("name")} />
            <Input placeholder="Phone" {...ecForm.register("phone")} />
            <Input placeholder="Relation" {...ecForm.register("relation")} />
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" {...ecForm.register("isPrimary")} />
              Primary contact
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="secondary" disabled={addEc.isPending}>
                Add contact
              </Button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-slate-900">3. Documents (Cloudinary, private)</h2>
        <p className="mt-1 text-xs text-slate-600">
          JPEG, PNG, WebP, or PDF up to 5 MB. You must upload <strong>Aadhaar front and back</strong>{" "}
          before submitting KYC.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {(profile.data?.documents ?? []).map((d) => (
            <li key={d.id}>
              {d.category} · {d.originalFilename} · {d.reviewStatus}
            </li>
          ))}
        </ul>
        {!locked ? (
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const file = fd.get("file") as File | null;
              const category = String(fd.get("category") ?? "");
              if (!file?.size || !category) {
                toast.error("Choose category and file");
                return;
              }
              uploadDoc.mutate({ category, file });
              e.currentTarget.reset();
            }}
          >
            <select name="category" className="h-10 rounded-lg border border-slate-200 px-2 text-sm">
              {docCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
            <Button type="submit" variant="secondary" disabled={uploadDoc.isPending}>
              Upload
            </Button>
          </form>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-slate-900">4. Submit for review</h2>
        <p className="mt-1 text-xs text-slate-600">
          After submission your PG owner will review documents and activate your tenancy.
        </p>
        <Button
          type="button"
          className="mt-4"
          disabled={locked || submitKyc.isPending || t?.status !== "ONBOARDING"}
          onClick={() => submitKyc.mutate()}
        >
          Submit KYC
        </Button>
      </section>
    </div>
  );
}
