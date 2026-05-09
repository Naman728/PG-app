import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createMaintenanceTicketDto, MAINTENANCE_CATEGORIES } from "@pg-manager/shared";
import type { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ROUTES } from "../../constants/routes";
import { createTenantMaintenanceTicket } from "../../services/maintenance.api";

type Form = z.infer<typeof createMaintenanceTicketDto>;

export function TenantMaintenanceNewPage() {
  const navigate = useNavigate();
  const form = useForm<Form>({
    resolver: zodResolver(createMaintenanceTicketDto),
    defaultValues: {
      title: "",
      description: "",
      category: "OTHER",
      priority: "MEDIUM",
      bedId: null,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: Form) => createTenantMaintenanceTicket(values),
    onSuccess: (data) => {
      toast.success("Ticket created");
      navigate(`${ROUTES.tenantMaintenance}/${data.id}`, { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link to={ROUTES.tenantMaintenance} className="text-sm font-medium text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">New maintenance request</h1>
        <p className="text-sm text-slate-600">
          Be specific — include location and when the issue started. You can add photos after creating.
        </p>
      </div>
      <form
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <label className="block text-sm">
          <span className="text-slate-600">Title</span>
          <Input className="mt-1" {...form.register("title")} />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Description</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
            rows={5}
            {...form.register("description")}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Category</span>
          <select className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm" {...form.register("category")}>
            {MAINTENANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Priority</span>
          <select className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm" {...form.register("priority")}>
            {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          Submit request
        </Button>
      </form>
    </div>
  );
}
