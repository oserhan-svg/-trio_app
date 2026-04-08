## 2025-04-08 - Critical Missing Auth on Internal Exec Route
**Vulnerability:** The `/internal/migrate` route in `server/routes/dealRoutes.js` executed arbitrary commands via `child_process.exec` without any authentication or authorization middleware.
**Learning:** Internal tooling routes that were likely used during development can be left exposed in production setups, offering an unauthenticated remote code execution (RCE) vector.
**Prevention:** Ensure all routes—especially internal or administrative endpoints that call powerful functions like `exec`—are systematically protected using `authenticateToken` and `authorizeRole('admin')`.
