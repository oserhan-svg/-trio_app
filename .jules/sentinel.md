## 2024-05-24 - Remove Exposed Database Migration Route
**Vulnerability:** An unauthenticated route `/internal/migrate` was exposed in `dealRoutes.js`, which executes `child_process.exec` to run Prisma migrations.
**Learning:** Internal tooling and testing routes are sometimes accidentally left in production code, exposing administrative or system-level actions to unauthorized users.
**Prevention:** Internal or testing routes should be completely removed from production builds or strictly protected with `authenticateToken` and `authorizeRole('admin')`.
