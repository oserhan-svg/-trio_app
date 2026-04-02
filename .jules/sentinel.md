## 2024-05-18 - Missing Authentication on Internal Migration Route
**Vulnerability:** The `/internal/migrate` route in `server/routes/dealRoutes.js` was missing authentication and authorization checks.
**Learning:** Internal or administrative routes executing database operations or child processes (like `child_process.exec`) must be strictly protected, otherwise they can expose the application to RCE/Command Injection or unintended database migrations.
**Prevention:** Ensure all internal or administrative Express routes are protected by both `authenticateToken` and `authorizeRole("admin")` middleware.
