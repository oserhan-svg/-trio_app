## 2025-05-26 - Protect Internal Migration Endpoints
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` executed shell commands via `child_process.exec` without any authentication or authorization middleware.
**Learning:** Internal or testing routes that execute database migrations or system commands must be completely removed from production builds or strictly protected to prevent Command Injection/RCE vulnerabilities.
**Prevention:** Always apply `authenticateToken` and `authorizeRole('admin')` to administrative or internal endpoints, and regularly audit routes for missing middleware.
