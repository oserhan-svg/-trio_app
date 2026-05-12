## 2024-05-24 - Unauthenticated Migration Endpoint
**Vulnerability:** An internal Express route (`/internal/migrate`) responsible for executing Prisma migrations via `child_process.exec` was exposed without any authentication or authorization checks.
**Learning:** Development, testing, or internal admin routes must never be left unprotected, as they can lead to DoS, unexpected schema modifications, or command injection if manipulated.
**Prevention:** Always wrap internal backend routes using `authenticateToken` and `authorizeRole('admin')` middleware, or completely remove them from production builds.
