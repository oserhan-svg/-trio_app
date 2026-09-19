## 2024-05-24 - Unauthenticated Migration Endpoint
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` lacked authentication, exposing an `exec` command that runs database migrations to unauthenticated users.
**Learning:** Endpoints intended for internal or developer use are sometimes added quickly without applying the standard authentication middleware used in the rest of the router.
**Prevention:** Always apply authentication middleware (e.g., `isAdmin`) to internal or administrative endpoints, even if they are intended for temporary or internal use.