## 2024-05-24 - Unauthenticated Route Exposing Command Execution Risk
**Vulnerability:** The `/internal/migrate` route in `server/routes/dealRoutes.js` calls `dealController.runInternalMigration` without any authentication or authorization middleware (`authenticateToken`, `authorizeRole`).
**Learning:** This route exposes an internal database migration command `exec` over HTTP to unauthenticated users, which could lead to DoS or unintended schema changes. It's missing standard route protection.
**Prevention:** Always apply `authenticateToken` and `authorizeRole` (e.g., admin only) to internal or administrative endpoints.
