## 2024-05-24 - Unauthenticated Internal Migration Endpoint
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` was unauthenticated and used `child_process.exec` to run Prisma migrations. It also leaked `stderr` directly in the HTTP response.
**Learning:** Internal tooling routes or utility endpoints designed for migrations are sometimes left unprotected, creating severe vulnerabilities. Returning raw system output leaks sensitive environment information.
**Prevention:** All internal/utility routes must be protected with `isAdmin` or similar role-based authorization. Error responses from system execution must always be sanitized to prevent leaking internal state.
