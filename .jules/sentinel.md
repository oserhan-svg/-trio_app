
## 2023-10-27 - [Command Injection via Unprotected Internal Migration Route]
**Vulnerability:** Found an unprotected Express route `/internal/migrate` in `server/routes/dealRoutes.js` that executed a raw shell command (`child_process.exec`) without any authorization or authentication checks.
**Learning:** Development/testing routes left in production code can easily lead to Remote Code Execution (RCE) if they invoke system commands. This specific route executed a Prisma migration, making it extremely dangerous.
**Prevention:** Always ensure internal or testing routes are completely removed from production builds. If required for specific internal administration, they must be strictly protected with both `authenticateToken` and `authorizeRole('admin')` middleware to prevent RCE vulnerabilities.
