/** Shown while lazy route chunks load. */
export function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-slate-500">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" aria-hidden />
      <p className="text-sm">Loading…</p>
    </div>
  );
}
