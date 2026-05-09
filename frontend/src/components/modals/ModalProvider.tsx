import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ModalContext,
  type ModalContextValue,
  type ModalOptions,
} from "./modal-context";

export function ModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);
  const [busy, setBusy] = useState(false);

  const closeModal = useCallback(() => {
    setOpen(false);
    setBusy(false);
    setOptions(null);
  }, []);

  const openModal = useCallback((opts: ModalOptions) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  const value = useMemo<ModalContextValue>(
    () => ({ openModal, closeModal }),
    [openModal, closeModal],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {open && options ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
              {options.title}
            </h2>
            {options.description ? (
              <p className="mt-2 text-sm text-slate-600">{options.description}</p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={closeModal}
                disabled={busy}
              >
                {options.cancelLabel ?? "Cancel"}
              </button>
              {options.onConfirm ? (
                <button
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                    options.tone === "danger"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-primary hover:opacity-95"
                  }`}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await options.onConfirm?.();
                      closeModal();
                    } catch {
                      // keep modal open; caller may toast
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "Please wait…" : (options.confirmLabel ?? "Confirm")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </ModalContext.Provider>
  );
}
