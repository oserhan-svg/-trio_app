## 2024-10-26 - Unauthenticated Migration Endpoint
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` executed `child_process.exec` without any authentication or authorization checks.
**Learning:** Internal or testing routes left exposed in the API can be exploited by attackers to run administrative commands or migrations.
**Prevention:** Ensure all internal routes are either removed in production or strictly protected with `authenticateToken` and `authorizeRole('admin')` middleware.
