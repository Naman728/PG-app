# PG Manager API

## Base URL

- Local development: `http://localhost:3000`
- All versioned routes are under `/api/v1`.

## Interactive docs

When the API is running (non-test mode), OpenAPI is served at:

- **Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

The machine-readable spec is built into the backend as `openapi.json` (copied to `dist/` on build). Extend `backend/src/openapi.json` when you add public routes.

## Health checks

| Endpoint        | Purpose                                      |
|----------------|-----------------------------------------------|
| `GET /health`  | Liveness (legacy)                             |
| `GET /health/live`  | Liveness                               |
| `GET /health/ready` | Readiness — verifies database connectivity |

Orchestrators should use `/health/ready` for traffic routing.

## Authentication

1. **Sign up:** `POST /api/v1/auth/register` with JSON `{ "email", "password", "name?" }`. Creates an owner account, a default organization (when none exists), sets an HTTP-only refresh cookie, and returns `{ accessToken, user }`.
2. **Sign in:** `POST /api/v1/auth/login` with `{ "email", "password" }` — same cookie + access token response.
3. Send `Authorization: Bearer <access_token>` on protected routes.
4. **Refresh:** `POST /api/v1/auth/refresh` (uses refresh cookie). **Logout:** `POST /api/v1/auth/logout`.

Tenant invite links still use `POST .../invitations/:token/otp/request` and `.../otp/verify` (SMS OTP on the invited phone).

## Errors

JSON error bodies follow the shared `ApiError` shape (`packages/shared`):

- `error.code` — stable machine code
- `error.message` — human-readable message
- `error.requestId` — present when the server assigned an `X-Request-Id` (echo that header on retries for support).

## Postman

Import `docs/postman/PG_Manager.postman_collection.json` and set collection variables:

- `baseUrl` — e.g. `http://localhost:3000`
- `accessToken` — after login flow

## Docker

From the repository root:

```bash
docker compose up --build
```

Uses `docker/Dockerfile.api` and Postgres 16. Apply migrations before relying on the API (e.g. `npm run db:migrate` against the compose database URL, or run a one-off migrate container in production).

## Production notes

- Set `CORS_ORIGINS` to a comma-separated list of allowed web origins.
- Set `LOG_LEVEL` to `info` or `warn` in production.
- Use a strong `JWT_SECRET` (32+ characters).
- Run database migrations as a separate release step before rolling new app instances.
