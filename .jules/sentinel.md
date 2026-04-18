## 2026-04-17 - Missing Authentication on Internal Migration Route
**Vulnerability:** The `/internal/migrate` route in `server/routes/dealRoutes.js` uses `child_process.exec` without any authentication or authorization middleware.
**Learning:** Internal or testing routes left unprotected expose the system to unauthorized access and potential RCE/Command Injection if shell commands are used.
**Prevention:** Ensure all internal or administrative Express routes are protected by both `authenticateToken` and `authorizeRole('admin')` middleware.
