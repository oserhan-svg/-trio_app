## 2024-05-10 - Unauthenticated Remote Command Execution (RCE) in Migration Route
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` executed system commands (`child_process.exec`) without any authentication or authorization checks.
**Learning:** Development or administrative endpoints left in production without strict role-based access control (RBAC) expose the server to arbitrary command execution.
**Prevention:** Always secure internal, administrative, or testing routes with both `authenticateToken` and `authorizeRole('admin')` middleware, or completely remove them from production builds.
