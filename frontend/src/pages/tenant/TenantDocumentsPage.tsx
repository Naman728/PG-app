import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  deleteTenantDocument,
  fetchTenantProfile,
  getTenantDocumentSignedUrl,
  uploadTenantDocument,
} from "../../services/tenant.api";

const categories = [
  "AADHAAR_FRONT",
  "AADHAAR_BACK",
  "PROFILE_PHOTO",
  "RENT_AGREEMENT",
  "OTHER",
] as const;

export function TenantDocumentsPage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["tenant-profile"], queryFn: fetchTenantProfile });
  const t = profile.data?.tenant;
  const locked = t?.status !== "ONBOARDING";

  const upload = useMutation({
    mutationFn: ({ category, file }: { category: string; file: File }) =>
      uploadTenantDocument(category, file),
    onSuccess: async () => {
      toast.success("Uploaded");
      await qc.invalidateQueries({ queryKey: ["tenant-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: deleteTenantDocument,
    onSuccess: async () => {
      toast.success("Removed");
      await qc.invalidateQueries({ queryKey: ["tenant-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function view(docId: string) {
    try {
      const { url } = await getTenantDocumentSignedUrl(docId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-semibold text-slate-900">Your documents</h2>
        <p className="mt-1 text-xs text-slate-600">
          Files are stored privately on Cloudinary. “View” opens a short-lived signed link.
        </p>
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {(profile.data?.documents ?? []).map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <div className="font-medium text-slate-900">{d.originalFilename}</div>
                <div className="text-xs text-slate-500">
                  {d.category} · {d.reviewStatus}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" className="text-xs" onClick={() => void view(d.id)}>
                  View
                </Button>
                {!locked ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-red-700"
                    disabled={del.isPending}
                    onClick={() => del.mutate(d.id)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {!locked ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-sm font-semibold text-slate-900">Upload</h3>
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const file = fd.get("file") as File | null;
              const category = String(fd.get("category") ?? "");
              if (!file?.size) {
                toast.error("Choose a file");
                return;
              }
              upload.mutate({ category, file });
              e.currentTarget.reset();
            }}
          >
            <select name="category" className="h-10 rounded-lg border border-slate-200 px-2 text-sm">
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" />
            <Button type="submit" variant="secondary" disabled={upload.isPending}>
              Upload
            </Button>
          </form>
        </section>
      ) : (
        <p className="text-sm text-slate-600">Uploads are locked after onboarding.</p>
      )}
    </div>
  );
}
