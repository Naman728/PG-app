/**
 * Root `prepare` lifecycle: build shared workspace, then install Husky git hooks locally only.
 *
 * Skips Husky when:
 * - `CI=true` (GitHub Actions, etc.)
 * - `VERCEL=1` (Vercel install/build)
 * - `HUSKY=0` (explicit opt-out)
 *
 * Also skips if the `husky` binary is missing (e.g. `npm install --omit=dev`).
 */
const { execSync } = require("node:child_process");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("npm run build -w @pg-manager/shared");

const skipHusky =
  process.env.HUSKY === "0" ||
  process.env.CI === "true" ||
  String(process.env.VERCEL || "") === "1";

if (skipHusky) {
  console.log("[prepare] skipping husky (CI, Vercel, or HUSKY=0)");
  process.exit(0);
}

try {
  run("husky");
} catch (err) {
  const code = err?.code;
  const status = err?.status;
  if (code === "ENOENT" || status === 127) {
    console.warn("[prepare] husky binary not found; skipping (production or minimal install)");
    process.exit(0);
  }
  process.exit(status ?? 1);
}
