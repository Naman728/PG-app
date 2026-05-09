import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { ModalProvider } from "../components/modals/ModalProvider";
import { OfflineNotice } from "../components/pwa/OfflineNotice";
import { PwaReloadPrompt } from "../components/pwa/PwaReloadPrompt";
import { queryClient } from "../lib/query-client";
import { fetchMe, refreshSession } from "../services/auth.api";
import { useAuthStore } from "../store/auth.store";
import { mapSessionToAuthUser } from "../utils/session-map";

async function bootstrapSession() {
  const { accessToken, clearSession, setSession, setUser } =
    useAuthStore.getState();

  const hydrateProfile = async () => {
    const profile = await fetchMe();
    setUser(mapSessionToAuthUser(profile));
    await queryClient.invalidateQueries({ queryKey: ["session"] });
  };

  if (accessToken) {
    try {
      await hydrateProfile();
      return;
    } catch {
      clearSession();
    }
  }

  try {
    const data = await refreshSession();
    setSession(data.accessToken, data.user);
    await hydrateProfile();
  } catch {
    // remain signed out
  }
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const finishBootstrap = () => {
      void bootstrapSession().finally(() => {
        if (!cancelled) setReady(true);
      });
    };

    // Rehydration can finish before this effect runs; `onFinishHydration` would never fire.
    if (useAuthStore.persist.hasHydrated()) {
      finishBootstrap();
      return () => {
        cancelled = true;
      };
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      finishBootstrap();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f4f6f5] px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>
        <OfflineNotice />
        {children}
        <PwaReloadPrompt />
        <Toaster
          position="top-center"
          theme="light"
          expand
          richColors
          closeButton
          duration={6000}
          gap={14}
          visibleToasts={5}
          offset="1rem"
          mobileOffset="0.75rem"
          toastOptions={{
            classNames: {
              toast:
                "!rounded-xl !p-4 !text-[15px] !leading-snug !shadow-2xl !border-2 !border-slate-200/90 !bg-white !text-slate-900 sm:!text-base",
              title: "!text-[15px] !font-semibold !text-slate-950 sm:!text-base",
              description: "!text-sm !text-slate-700 !mt-0.5",
              closeButton:
                "!left-auto !right-2 !top-2 !size-8 !border-2 !border-slate-300 !bg-white !opacity-100 hover:!bg-slate-50",
            },
          }}
          className="!z-[10060]"
          style={{ zIndex: 10060 }}
        />
      </ModalProvider>
    </QueryClientProvider>
  );
}
