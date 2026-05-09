import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { loginSchema, registerSchema } from "@pg-manager/shared";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ROUTES } from "../constants/routes";
import { fetchMe, loginWithPassword, registerWithPassword } from "../services/auth.api";
import { useAuthStore, type AuthUser } from "../store/auth.store";
import { mapSessionToAuthUser } from "../utils/session-map";

type Mode = "login" | "signup";

const loginFormSchema = loginSchema;
const signupFormSchema = registerSchema;

type LoginFormValues = z.infer<typeof loginFormSchema>;
type SignupFormValues = z.infer<typeof signupFormSchema>;

export function EmailAuthForm({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const onSignedIn = async (accessToken: string, user: AuthUser) => {
    setSession(accessToken, user);
    const profile = await fetchMe();
    setUser(mapSessionToAuthUser(profile));
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    toast.success("Signed in");
    if (profile.role === "TENANT") {
      navigate(ROUTES.tenant, { replace: true });
    } else {
      navigate(ROUTES.owner, { replace: true });
    }
  };

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => loginWithPassword(values),
    onSuccess: (data) => void onSignedIn(data.accessToken, data.user),
    onError: (err: Error) => toast.error(err.message),
  });

  const signupMutation = useMutation({
    mutationFn: (values: SignupFormValues) => registerWithPassword(values),
    onSuccess: (data) => void onSignedIn(data.accessToken, data.user),
    onError: (err: Error) => toast.error(err.message),
  });

  const isSignup = mode === "signup";

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            PG
          </div>
          <h1 className="text-xl font-semibold text-slate-900">PG Manager</h1>
          <p className="mt-2 text-sm text-slate-600">
            {isSignup ? "Create an owner account" : "Sign in with email and password"}
          </p>
        </div>

        {isSignup ? (
          <form
            className="space-y-4"
            onSubmit={signupForm.handleSubmit((v) => signupMutation.mutate(v))}
          >
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Name <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <Input
                id="name"
                placeholder="Your name"
                error={signupForm.formState.errors.name?.message}
                {...signupForm.register("name")}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={signupForm.formState.errors.email?.message}
                {...signupForm.register("email")}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                error={signupForm.formState.errors.password?.message}
                {...signupForm.register("password")}
              />
            </div>
            <Button type="submit" className="w-full py-2.5" disabled={signupMutation.isPending}>
              {signupMutation.isPending ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link to={ROUTES.login} className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        ) : (
          <form
            className="space-y-4"
            onSubmit={loginForm.handleSubmit((v) => loginMutation.mutate(v))}
          >
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={loginForm.formState.errors.email?.message}
                {...loginForm.register("email")}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                error={loginForm.formState.errors.password?.message}
                {...loginForm.register("password")}
              />
            </div>
            <Button type="submit" className="w-full py-2.5" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-slate-600">
              New here?{" "}
              <Link to={ROUTES.signup} className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
