## 2024-05-24 - Missing Authentication on Internal Migration Route
**Vulnerability:** The `/internal/migrate` route in `dealRoutes.js` was exposed without any authentication or authorization middleware. This route executes database migrations via `child_process.exec`.
**Learning:** Internal or testing routes that execute sensitive operations like shell commands or database migrations must never be exposed publicly, as this can lead to unauthorized execution and potential RCE/Command Injection vulnerabilities.
**Prevention:** Always strictly protect all administrative, internal, or testing routes with both `authenticateToken` and `authorizeRole('admin')` middleware, or remove them entirely from production builds.
