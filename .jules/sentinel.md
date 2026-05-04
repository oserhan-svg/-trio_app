## 2024-05-24 - Unauthenticated Route Executing Child Processes
**Vulnerability:** The internal migration endpoint `/internal/migrate` in `server/routes/dealRoutes.js` uses `child_process.exec` but lacks authentication and authorization checks.
**Learning:** Developers sometimes expose debugging or maintenance endpoints in production codebeds without adequately securing them, leading to severe Command Injection/Remote Code Execution (RCE) vulnerabilities.
**Prevention:** All internal maintenance routes must be wrapped with `authenticateToken` and `authorizeRole('admin')` or removed from production builds entirely.
