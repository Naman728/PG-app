import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Install / update UX for the service worker. Shown when a new build is available
 * (`registerType: "prompt"` in vite.config).
 */
export function PwaReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.warn("[PWA] registration error", err);
    },
  });

  if (!offlineReady && !needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] left-3 right-3 z-[10070] md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
    >
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-900/10">
        <p className="text-sm font-semibold text-slate-900">
          {needRefresh ? "Update ready" : "Ready to work offline"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          {needRefresh
            ? "Install the latest version for fixes and improvements."
            : "Core screens load from cache when the network drops."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {needRefresh ? (
            <button
              type="button"
              className="min-h-11 flex-1 rounded-xl bg-[#0f6e56] px-4 text-sm font-semibold text-white hover:bg-[#0c5a47]"
              onClick={() => void updateServiceWorker(true)}
            >
              Update now
            </button>
          ) : null}
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            onClick={() => {
              setOfflineReady(false);
              setNeedRefresh(false);
            }}
          >
            {needRefresh ? "Later" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
