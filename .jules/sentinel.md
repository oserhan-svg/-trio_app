## 2024-04-11 - [Unauthenticated Remote Code Execution]
**Vulnerability:** The Express server contained an unauthenticated `/internal/migrate` route that called `child_process.exec` to run database migrations, allowing unauthenticated attackers to execute commands or potentially inject arbitrary commands via the route.
**Learning:** Internal or testing routes that execute child processes are a severe security risk if deployed to production without authentication and authorization checks.
**Prevention:** Remove all internal or testing routes that execute child processes from production builds. If such routes must exist, strictly protect them with both `authenticateToken` and `authorizeRole('admin')` middleware.
