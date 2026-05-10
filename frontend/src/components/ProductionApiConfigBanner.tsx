import { API_BASE_URL } from "../constants/config";

/**
 * Vite bakes `VITE_API_URL` at build time. Netlify (and similar) deploys often ship
 * the default `http://localhost:3000/api/v1`, which always fails from the public web.
 */
export function ProductionApiConfigBanner() {
  if (!import.meta.env.PROD) return null;
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return null;

  const base = (API_BASE_URL || "").trim();
  if (!/localhost|127\.0\.0\.1/i.test(base)) return null;

  return (
    <div
      role="alert"
      className="fixed left-0 right-0 top-0 z-[10060] border-b border-rose-400/90 bg-rose-600/95 px-4 py-3 text-left text-xs font-medium text-rose-50 shadow-md backdrop-blur-sm pt-[max(0.75rem,env(safe-area-inset-top,0px))]"
    >
      <p className="font-semibold">API URL is not configured for this deployment.</p>
      <p className="mt-1 opacity-95">
        This build is still calling{" "}
        <code className="rounded bg-rose-900/40 px-1 py-0.5">{base}</code> from{" "}
        <code className="rounded bg-rose-900/40 px-1 py-0.5">{host}</code>. In Netlify
        go to <strong>Site configuration → Environment variables</strong>, add{" "}
        <code className="rounded bg-rose-900/40 px-1 py-0.5">VITE_API_URL</code> to your
        real API base (e.g.{" "}
        <code className="rounded bg-rose-900/40 px-1 py-0.5">
          https://api.example.com/api/v1
        </code>
        ), then trigger a new deploy. On the API, set{" "}
        <code className="rounded bg-rose-900/40 px-1 py-0.5">FRONTEND_URL</code> or{" "}
        <code className="rounded bg-rose-900/40 px-1 py-0.5">CORS_ORIGINS</code> to{" "}
        <code className="rounded bg-rose-900/40 px-1 py-0.5">
          {window.location.origin}
        </code>
        .
      </p>
    </div>
  );
}
