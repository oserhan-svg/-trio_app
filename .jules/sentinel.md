## 2024-05-14 - Missing Authentication on Internal Migration Endpoint
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` was unauthenticated and executed a system command (`child_process.exec`) to run a Prisma migration.
**Learning:** Internal or testing routes left in production code without proper auth guards expose the application to unauthorized actions and potential RCE/Command Injection if input ever becomes dynamic.
**Prevention:** Ensure all internal or administrative Express routes are protected by both `authenticateToken` and `authorizeRole('admin')` middleware.
