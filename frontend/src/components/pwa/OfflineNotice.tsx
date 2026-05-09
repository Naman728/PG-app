import { useEffect, useState } from "react";

export function OfflineNotice() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed left-0 right-0 top-0 z-[10055] border-b border-amber-300/90 bg-amber-400/95 px-4 py-2.5 text-center text-xs font-semibold text-amber-950 shadow-md backdrop-blur-sm pt-[max(0.5rem,env(safe-area-inset-top,0px))]"
    >
      You&apos;re offline — reconnect to load fresh data. The installed shell may still open.
    </div>
  );
}
