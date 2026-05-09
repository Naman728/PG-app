/**
 * Root `prepare`: always compile @pg-manager/shared, then install Husky locally when allowed.
 *
 * Husky is skipped when CI=true, VERCEL=1, or HUSKY=0 (Vercel / CI / explicit opt-out).
 * Husky failures never fail `npm install` (missing binary, npx errors, etc.).
 *
 * Shared build failures ARE propagated so broken workspaces do not silently install.
 */
"use strict";

const { execSync } = require("node:child_process");

const opts = {
  stdio: "inherit",
  env: process.env,
  shell: true,
};

try {
  execSync("npm run build -w @pg-manager/shared", opts);
} catch (err) {
  const st = typeof err.status === "number" ? err.status : 1;
  console.error("[prepare] @pg-manager/shared build failed");
  process.exit(st);
}

const vercel = String(process.env.VERCEL || "").toLowerCase();
const skip =
  process.env.HUSKY === "0" ||
  process.env.CI === "true" ||
  vercel === "1" ||
  vercel === "true";

if (skip) {
  console.log("[prepare] skipping husky");
  process.exit(0);
}

try {
  execSync("npx husky", opts);
} catch {
  try {
    execSync("husky", opts);
  } catch {
    console.warn("[prepare] husky skipped");
  }
}

process.exit(0);
