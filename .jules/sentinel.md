## 2024-05-01 - Unauthenticated Shell Execution in Migration Route
**Vulnerability:** An unauthenticated `/internal/migrate` endpoint in `dealRoutes.js` allowed triggering `child_process.exec`, posing a severe risk of DoS and potentially RCE.
**Learning:** Development/testing routes are often left in production files without authentication middleware.
**Prevention:** Always require `authenticateToken` and `authorizeRole('admin')` for any internal endpoints, or remove them entirely before production.
