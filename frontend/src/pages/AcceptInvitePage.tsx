import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { invitationVerifyOtpDto } from "@pg-manager/shared";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ROUTES } from "../constants/routes";
import {
  previewInvitation,
  requestInvitationOtp,
  verifyInvitationOtp,
} from "../services/invitation-public.api";
import { useAuthStore } from "../store/auth.store";
import { mapSessionToAuthUser } from "../utils/session-map";
import { fetchMe } from "../services/auth.api";

type Step = "preview" | "otp";

const otpSchema = invitationVerifyOtpDto;
type OtpValues = z.infer<typeof otpSchema>;

export function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<Step>("preview");

  const preview = useQuery({
    queryKey: ["invite-preview", token],
    queryFn: () => previewInvitation(token!),
    enabled: Boolean(token),
  });

  const requestMutation = useMutation({
    mutationFn: () => requestInvitationOtp(token!),
    onSuccess: () => {
      toast.success("OTP sent via SMS to the invited number.");
      setStep("otp");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  const verifyMutation = useMutation({
    mutationFn: (values: OtpValues) => verifyInvitationOtp(token!, values),
    onSuccess: async (data) => {
      setSession(data.accessToken, data.user);
      const profile = await fetchMe();
      setUser(mapSessionToAuthUser(profile));
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Welcome! You're signed in as a tenant.");
      navigate(ROUTES.tenant, { replace: true });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!token) {
    return <div className="p-6 text-sm text-red-700">Invalid invite link.</div>;
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[#f4f6f5] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            PG
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Tenant invite</h1>
        </div>

        {preview.isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          </div>
        ) : preview.isError ? (
          <p className="text-sm text-red-700">
            This invite is invalid or has expired. Ask your PG owner for a new SMS.
          </p>
        ) : step === "preview" ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              You&apos;ve been invited to{" "}
              <span className="font-semibold text-slate-900">
                {preview.data?.organizationName}
              </span>{" "}
              in <span className="font-medium">{preview.data?.city}</span>.
            </p>
            <p className="text-xs text-slate-500">
              We&apos;ll send a one-time code via SMS to{" "}
              <span className="font-medium">{preview.data?.phoneMasked}</span>.
            </p>
            <Button
              type="button"
              className="w-full py-2.5"
              disabled={requestMutation.isPending}
              onClick={() => requestMutation.mutate()}
            >
              {requestMutation.isPending ? "Sending OTP…" : "Send OTP"}
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={otpForm.handleSubmit((v) => verifyMutation.mutate(v))}
          >
            <p className="text-sm text-slate-600">
              Enter the 6-digit code sent to the invited phone number.
            </p>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              {...otpForm.register("code")}
              error={otpForm.formState.errors.code?.message}
            />
            <Button type="submit" className="w-full py-2.5" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? "Verifying…" : "Verify & continue"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
